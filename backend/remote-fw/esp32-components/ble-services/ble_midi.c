#include "esp_gatts_api.h"

#include "esp_log.h"
#include "string.h"

#define TAG "midi"

typedef struct midi_service {
    uint16_t gatts_if;
    uint16_t app_id;

    uint16_t             service_handle;
    esp_gatt_srvc_id_t   service_id;
    uint16_t             char_handle;
    esp_bt_uuid_t        char_uuid;
    esp_gatt_perm_t      perm;
    esp_gatt_char_prop_t property;
    uint16_t             descr_handle;
    esp_bt_uuid_t        descr_uuid;
} midi_service_t;

static midi_service_t _service = {0};

static uint8_t            midi_data[1] = {0xF7};
static esp_attr_value_t   char_value = {.attr_value = midi_data, .attr_max_len = 1, .attr_len = 1};
static esp_attr_control_t char_attr = {.auto_rsp = ESP_GATT_AUTO_RSP};

// first uuid, 16bit, [12],[13] is the value
// second uuid, 32bit, [12], [13], [14], [15] is the value

// clang-format off
static const uint8_t service_uuid128[16] = {
    /* LSB <--------------------------------------------------------------------------------> MSB */
    0x00,  0xC7, 0xC4, 0x4E, 0xE3, 0x6C, 0x51, 0xA7, 0x33, 0x4B, 0xE8, 0xED, 0x5A, 0x0E, 0xB8, 0x03,
};

static const uint8_t midi_io_char_uuid128[] = {
    0xF3, 0x6B, 0x10, 0x9D, 0x66, 0xF2, 0xA9, 0xA1, 0x12, 0x41, 0x68, 0x38, 0xDB, 0xE5, 0x72, 0x77
};

// clang-format on

void midi_service_init(uint16_t app_id)
{
    ESP_LOGD(TAG, "> Midi service <");

    _service.app_id = app_id;
    esp_ble_gatts_app_register(app_id);
}

/**
 * @brief midi_service_gatts_event_handler
 * @param event
 * @param gatts_if
 * @param param
 */
void midi_service_gatts_event_handler(esp_gatts_cb_event_t event, esp_gatt_if_t gatts_if, esp_ble_gatts_cb_param_t* param)
{
    /* If event is register event, store the gatts_if for each profile */
    if (event == ESP_GATTS_REG_EVT && param->reg.status == ESP_GATT_OK && param->reg.app_id == _service.app_id) {
        _service.gatts_if = gatts_if;
    }

    if (gatts_if != _service.gatts_if)
        return;

    switch (event) {
        case ESP_GATTS_REG_EVT:
            ESP_LOGI(TAG, "REGISTER_APP_EVT, status %d, app_id %d", param->reg.status, param->reg.app_id);
            _service.service_id.is_primary  = true;
            _service.service_id.id.inst_id  = 0x00;
            _service.service_id.id.uuid.len = ESP_UUID_LEN_128;
            memcpy(&_service.service_id.id.uuid.uuid.uuid128, service_uuid128, 16);

            esp_ble_gatts_create_service(gatts_if, &_service.service_id, 4);
            break;
        case ESP_GATTS_EXEC_WRITE_EVT:
        case ESP_GATTS_MTU_EVT:
        case ESP_GATTS_CONF_EVT:
        case ESP_GATTS_UNREG_EVT:
            break;
        case ESP_GATTS_CREATE_EVT:
            ESP_LOGI(
                TAG, "CREATE_SERVICE_EVT, status %d,  service_handle %d", param->create.status, param->create.service_handle);

            _service.service_handle = param->create.service_handle;
            _service.char_uuid.len  = ESP_UUID_LEN_128;
            memcpy(&_service.char_uuid.uuid.uuid128, midi_io_char_uuid128, ESP_UUID_LEN_128);

            esp_ble_gatts_start_service(_service.service_handle);

            esp_ble_gatts_add_char(_service.service_handle,
                                   &_service.char_uuid,
                                   ESP_GATT_PERM_READ | ESP_GATT_PERM_WRITE,
                                   ESP_GATT_CHAR_PROP_BIT_READ | ESP_GATT_CHAR_PROP_BIT_WRITE | ESP_GATT_CHAR_PROP_BIT_NOTIFY,
                                   &char_value,
                                   &char_attr);
            break;
        case ESP_GATTS_ADD_CHAR_EVT:
            if (param->add_char.status == ESP_GATT_OK) {

                ESP_LOGI(TAG,
                         "ADD_CHAR_EVT, status %d,  attr_handle %d, service_handle %d",
                         param->add_char.status,
                         param->add_char.attr_handle,
                         param->add_char.service_handle);
                _service.char_handle = param->add_char.attr_handle;
            } else {
                ESP_LOGE(TAG, "Error while adding characteristic: 0x02%x", param->add_char.status);
            }
            break;
        case ESP_GATTS_ADD_CHAR_DESCR_EVT:

            break;
        case ESP_GATTS_ADD_INCL_SRVC_EVT:
            break;
        case ESP_GATTS_READ_EVT: {
            ESP_LOGI(TAG,
                     "GATT_READ_EVT, conn_id %d, trans_id %d, handle %d",
                     param->read.conn_id,
                     param->read.trans_id,
                     param->read.handle);
            break;
        }
        case ESP_GATTS_WRITE_EVT: {
            ESP_LOGI(TAG,
                     "GATT_WRITE_EVT, conn_id %d, trans_id %d, handle %d",
                     param->write.conn_id,
                     param->write.trans_id,
                     param->write.handle);
            ESP_LOGI(TAG, "GATT_WRITE_EVT, value len %d, value %08x", param->write.len, *(uint32_t*)param->write.value);
            esp_ble_gatts_send_response(gatts_if, param->write.conn_id, param->write.trans_id, ESP_GATT_OK, NULL);
            break;
        }
        case ESP_GATTS_DELETE_EVT:
            break;
        case ESP_GATTS_START_EVT:
            ESP_LOGI(TAG, "SERVICE_START_EVT, status %d, service_handle %d", param->start.status, param->start.service_handle);
            break;
        case ESP_GATTS_STOP_EVT:
            break;
        case ESP_GATTS_CONNECT_EVT:
            ESP_LOGI(TAG,
                     "SERVICE_START_EVT, conn_id %d, remote " ESP_BD_ADDR_STR "",
                     param->connect.conn_id,
                     ESP_BD_ADDR_HEX(param->connect.remote_bda)
                     );
            //            _service.conn_id = param->connect.conn_id;
            break;
        case ESP_GATTS_DISCONNECT_EVT:
            ESP_LOGD(TAG, "Disconnected");
            break;
        case ESP_GATTS_OPEN_EVT:
        case ESP_GATTS_CANCEL_OPEN_EVT:
        case ESP_GATTS_CLOSE_EVT:
        case ESP_GATTS_LISTEN_EVT:
        case ESP_GATTS_CONGEST_EVT:
        default:
            break;
    }
}
