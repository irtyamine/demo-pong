
#include "esp_event.h"
#include "esp_event_loop.h"
#include "esp_log.h"
#include "esp_ota_ops.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"
#include <string.h>

#include "nvs_flash.h"

#include "driver/adc.h"
#include "driver/gpio.h"
#include "driver/i2c.h"
#include "esp_adc_cal.h"
#include "soc/adc_channel.h"

#include "esp_bt.h"
#include "esp_bt_defs.h"
#include "esp_bt_main.h"
#include "esp_gap_ble_api.h"
#include "esp_gatts_api.h"

#include <math.h>

static const uint8_t v_major = FW_VERSION_MAJOR;
static const uint8_t v_minor = FW_VERSION_MINOR;
static const uint8_t v_patch = FW_VERSION_PATCH;

esp_bt_controller_config_t bt_ctrl_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();

#define DEVICE_TYPE "k-pong-remote"

#define DEVICE_ID_FMT "%02X%02X%02X%02X%02X%02X"
#define DEVICE_ID_ARGS(device_id)                                              \
  device_id[0], device_id[1], device_id[2], device_id[3], device_id[4],        \
      device_id[5]

static const char *TAG = "PONG";
static char _device_id[12] = {0};
static uint8_t _device_id_raw[6] = {0};

// -- Hardware definition -- //

#define LIGHT_SENSOR_RL 10000.f // Load resistor in ohms
#define LIGHT_SENSOR_V 5.f      // Collector

#define PIR_MOTION_SENSOR_GPIO GPIO_NUM_32
#define PIR_MOTION_SENSOR_GPIO_SEL GPIO_SEL_32

#define SI7021_I2C_SDA_GPIO GPIO_NUM_17
#define SI7021_I2C_SDC_GPIO GPIO_NUM_16

#define BUTTON_GPIO GPIO_NUM_0
#define BUTTON_GPIO_SEL GPIO_SEL_0

#define LED_GPIO GPIO_NUM_4
#define LED_GPIO_SEL GPIO_SEL_4

// -- BLE -- //

static const int16_t KUZZLE_BLE_ID = 0x6012;
static const int16_t KUZZLE_DEVICE_SKU = 0x0002;

// clang-format off
uint8_t adv_data_raw[] = {
    0x02, ESP_BLE_AD_TYPE_FLAG, 0x06,
    0x05, ESP_BLE_AD_TYPE_NAME_CMPL, 'P', 'O', 'N', 'G',
    0x11, ESP_BLE_AD_TYPE_128SRV_PART, 0x69, 0x4c, 0x73, 0x11, 0x48, 0x78, 0xab, 0x0c, 0x8c, 0x7a, 0x5c, 0x9b, 0x2a, 0xbb, 0x01, 0x07
};

uint8_t adv_data_state[31] = {
    0x01, ESP_BLE_AD_MANUFACTURER_SPECIFIC_TYPE
};
// clang-format oninit_device_id

static esp_ble_adv_params_t adv_params = {
    .adv_int_min   = 0x20,
    .adv_int_max   = 0x40,
    .adv_type      = ADV_TYPE_IND,
    .own_addr_type = BLE_ADDR_TYPE_PUBLIC,
    //.peer_addr            =
    //.peer_addr_type       =
    .channel_map       = ADV_CHNL_ALL,
    .adv_filter_policy = ADV_FILTER_ALLOW_SCAN_ANY_CON_ANY,
};

/**
 * @brief _publish_state
 */
static void _publish_state(uint16_t position)
{
        // -- publish via BLE ADV -- //

        void*   p      = adv_data_state + 2;
        uint8_t offset = 0;

        memcpy(p + offset,
               &KUZZLE_BLE_ID,
               sizeof(KUZZLE_BLE_ID)); 
        offset += sizeof(KUZZLE_BLE_ID);

        memcpy(p + offset,
               &KUZZLE_DEVICE_SKU,
               sizeof(KUZZLE_DEVICE_SKU)); 
        offset += sizeof(KUZZLE_DEVICE_SKU);

        memcpy(p + offset, &v_major, sizeof(v_major)); 
        offset += sizeof(v_major);

        memcpy(p + offset, &v_minor, sizeof(v_minor)); 
        offset += sizeof(v_minor);

        memcpy(p + offset, &v_patch, sizeof(v_patch)); 
        offset += sizeof(v_patch);

        memcpy(p + offset, &_device_id_raw, sizeof(_device_id_raw)); 
        offset += sizeof(_device_id_raw);

        memcpy(p + offset, &position, sizeof(position)); 
        offset += sizeof(position);

        adv_data_state[0] = offset + 1;

        esp_ble_gap_config_adv_data_raw(adv_data_state, sizeof(adv_data_state));
        esp_ble_gap_config_scan_rsp_data_raw(adv_data_state, sizeof(adv_data_state));

}


/*
static xQueueHandle gpio_evt_queue = NULL;

static void IRAM_ATTR on_motion_sensor_gpio_isr(void* data)
{
    kEvent_t event = kEvent_PIRMotion;
    gpio_set_level(LED_GPIO, gpio_get_level(PIR_MOTION_SENSOR_GPIO));
    xQueueSendToBackFromISR(gpio_evt_queue, &event, NULL);
}

static void IRAM_ATTR on_button_gpio_isr(void* data)
{
    kEvent_t event = kEvent_Button;
    xQueueSendToBackFromISR(gpio_evt_queue, &event, NULL);
}
*/


static void gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t* param)
{
    switch (event) {
        case ESP_GAP_BLE_ADV_DATA_RAW_SET_COMPLETE_EVT:
            esp_ble_gap_start_advertising(&adv_params);
            break;
        case ESP_GAP_BLE_ADV_START_COMPLETE_EVT:

            // advertising start complete event to indicate advertising
            // start successfully or failed

            if (param->adv_start_cmpl.status != ESP_BT_STATUS_SUCCESS) {
                ESP_LOGE(TAG, "Advertising start failed");
            } 
            break;
        default:
            break;
    }
}

static void gatts_event_handler(esp_gatts_cb_event_t event, esp_gatt_if_t gatts_if, esp_ble_gatts_cb_param_t* param)
{
    if (event == ESP_GATTS_DISCONNECT_EVT) {
        ESP_LOGD(TAG, "GATTC disconnected, advertizing again: gatts_if = 0x%02x", gatts_if);
        esp_ble_gap_start_advertising(&adv_params);
    }

    //  midi_service_gatts_event_handler(event, gatts_if, param);
    //  dis_gatts_event_handler(event, gatts_if, param);
    //  kuzzle_ble_gatts_event_handler(event, gatts_if, param);

    // TODO: add your GATTS event handler here...
}
esp_err_t event_handler(void* ctx, system_event_t* event) { return ESP_OK; }

void init_ble()
{
    esp_err_t err;

    ESP_ERROR_CHECK(esp_bt_controller_init(&bt_ctrl_cfg));

    err = esp_bt_controller_enable(ESP_BT_MODE_BTDM);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "%s enable controller failed, err = 0x%02x", __func__, err);
        return;
    }

    err = esp_bluedroid_init();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "%s init bluetooth failed", __func__);
        return;
    }
    err = esp_bluedroid_enable();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "%s enable bluetooth failed", __func__);
        return;
    }

    esp_ble_gatts_register_callback(gatts_event_handler);
    esp_ble_gap_register_callback(gap_event_handler);

    esp_ble_gap_set_device_name(DEVICE_TYPE);
    //esp_ble_gap_config_adv_data_raw(adv_data_raw, sizeof(adv_data_raw));
}

void init_device_id()
{
    esp_wifi_get_mac(WIFI_MODE_STA, _device_id_raw);
    snprintf(_device_id, 12, DEVICE_ID_FMT, DEVICE_ID_ARGS(_device_id_raw));
    ESP_LOGI(TAG, LOG_BOLD(LOG_COLOR_CYAN) "Device ID = %s", _device_id);
}

/**
 * @brief app_main
 *
 * Main run loop/task
 */
void app_main(void)
{
    nvs_flash_init();

    tcpip_adapter_init();

    ESP_ERROR_CHECK(esp_event_loop_init(event_handler, NULL));

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    ESP_ERROR_CHECK(esp_wifi_set_storage(WIFI_STORAGE_RAM));

    init_device_id();

    ESP_LOGI(TAG, ">>> Firmware version: %u.%u.%u <<<  git commit: %s", v_major, v_minor, v_patch, FW_VERSION_COMMIT);

    init_ble();
    // Configure ADC
    adc1_config_width(ADC_WIDTH_12Bit);
    adc1_config_channel_atten(ADC1_GPIO32_CHANNEL, ADC_ATTEN_11db);

    float p0, p1;
    float factor = 0.9;
    p0 = adc1_get_raw(ADC1_GPIO32_CHANNEL);
    while (true) {
        // Read ADC and obtain result in mV

        p1 = adc1_get_raw(ADC1_GPIO32_CHANNEL);
        p1 += adc1_get_raw(ADC1_GPIO32_CHANNEL);
        p1 += adc1_get_raw(ADC1_GPIO32_CHANNEL);
        p1 += adc1_get_raw(ADC1_GPIO32_CHANNEL);

        p1/=4;

        p0 = factor *p0 + (1.0f-factor) * p1;

       _publish_state((uint16_t)round(p0));

        ESP_LOGD(TAG, "Position = %2f", p0);

        vTaskDelay(10 / portTICK_PERIOD_MS);
    }
}
