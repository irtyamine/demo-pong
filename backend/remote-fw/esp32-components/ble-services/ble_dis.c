#include <stdlib.h>
#include <string.h>

#include "esp_gap_ble_api.h"
#include "esp_gatts_api.h"
#include "esp_log.h"

#undef TAG
#define TAG "BLE-DIS"

// https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.device_information.xml
static const uint16_t dis_uuid16 = 0x180A;

static const uint16_t char_uuid_model_number      = 0x2a24;
static const uint16_t char_uuid_manufacturer_name = 0x2a29;
static const uint16_t char_uuid_serial_number     = 0x2a25;
static const uint16_t char_uuid_hardware_revision = 0x2a27;
static const uint16_t char_uuid_firmware_revision = 0x2a26;
static const uint16_t char_uuid_software_revision = 0x2a28;
static const uint16_t char_uuid_system_id         = 0x2a23;
// TODO: Add UPnP ID characteristic handling

#define CHAR_DECLARATION_SIZE (sizeof(uint8_t))
static const uint16_t primary_service_uuid         = ESP_GATT_UUID_PRI_SERVICE;
static const uint16_t character_declaration_uuid   = ESP_GATT_UUID_CHAR_DECLARE;
static const uint16_t character_client_config_uuid = ESP_GATT_UUID_CHAR_CLIENT_CONFIG;

static const uint8_t char_prop_notify     = ESP_GATT_CHAR_PROP_BIT_NOTIFY;
static const uint8_t char_prop_read       = ESP_GATT_CHAR_PROP_BIT_READ;
static const uint8_t char_prop_read_write = ESP_GATT_CHAR_PROP_BIT_WRITE | ESP_GATT_CHAR_PROP_BIT_READ;

#define MAX_CHARACTERISTICS 1

typedef struct dis_data {
    esp_attr_value_t model_number;
    esp_attr_value_t manufacturer_name;
    esp_attr_value_t hardware_revision;
    esp_attr_value_t software_revision;
    esp_attr_value_t firmware_revision;
} dis_data_t;

typedef struct characteristic_data {
    //    esp_attr_value_t     char_value;
    esp_bt_uuid_t        char_uuid;
    uint16_t             char_handle;
    esp_gatt_perm_t      perms;
    esp_gatt_char_prop_t properties;
    esp_bt_uuid_t        descr_uuid;
    uint16_t             descr_handle;
} characteristic_data_t;

typedef struct dis_service_data {
    uint16_t           gatts_if;
    uint16_t           app_id;
    uint16_t           service_handle; /// handle to the service
    esp_gatt_srvc_id_t service_id;     /// id of the service

    characteristic_data_t chars[MAX_CHARACTERISTICS]; /// array of charecteristics descriptions
    uint16_t              nb_chars;                   /// number of currently enabled caracteristiques in the service

} dis_service_data_t;

static dis_service_data_t _service = {.gatts_if = ESP_GATT_IF_NONE, 0};
dis_data_t                _dis_data = {0};
// static esp_attr_control_t char_attr = {.auto_rsp = ESP_GATT_AUTO_RSP};

static uint8_t             _char_idx      = 0;
static esp_gatts_attr_db_t _dis_attrs[11] = {0};

#define GATTS_CHAR_VAL_LEN_MAX 40

/**
 * @brief _set_char_attr
 *
 * @param v: the attribute value to be updated
 * @param s: the null terminated string to set as new value. NULL value would just release data
 */
static void _set_char_attr(esp_attr_value_t* v, const char* s)
{
    assert(v != NULL);

    if (v->attr_value != NULL) {
        free(v->attr_value);
        memset(v, 0, sizeof(esp_attr_value_t));
    }

    if (s != NULL) {
        v->attr_value   = (uint8_t*)strdup(s);
        v->attr_len     = strlen(s);
        v->attr_max_len = v->attr_len;
    }
}

void _add_char(const uint8_t* p_char_prop)
{
    _dis_attrs[_char_idx].att_desc.uuid_length = ESP_UUID_LEN_16;                       /*!< UUID length */
    _dis_attrs[_char_idx].att_desc.uuid_p      = (uint8_t*)&character_declaration_uuid; /*!< UUID value */
    _dis_attrs[_char_idx].att_desc.perm        = ESP_GATT_PERM_READ;                    /*!< Attribute permission */
    _dis_attrs[_char_idx].att_desc.max_length  = CHAR_DECLARATION_SIZE;                 /*!< Maximum length of the element*/
    _dis_attrs[_char_idx].att_desc.length      = CHAR_DECLARATION_SIZE;                 /*!< Current length of the element*/
    _dis_attrs[_char_idx].att_desc.value       = (uint8_t*)p_char_prop;                 /*!< Element value array*/

    _dis_attrs[_char_idx].attr_control.auto_rsp = ESP_GATT_AUTO_RSP;

    _char_idx++;
}

void _add_char_value(esp_attr_value_t* attr_value, uint16_t uuid_len, uint8_t* p_uuid, uint16_t gatt_perm)
{
    _dis_attrs[_char_idx].att_desc.uuid_length = uuid_len;                 /*!< UUID length */
    _dis_attrs[_char_idx].att_desc.uuid_p      = p_uuid;                   /*!< UUID value */
    _dis_attrs[_char_idx].att_desc.perm        = gatt_perm;                /*!< Attribute permission */
    _dis_attrs[_char_idx].att_desc.max_length  = attr_value->attr_max_len; /*!< Maximum length of the element*/
    _dis_attrs[_char_idx].att_desc.length      = attr_value->attr_len;     /*!< Current length of the element*/
    _dis_attrs[_char_idx].att_desc.value       = attr_value->attr_value;   /*!< Element value array*/

    _dis_attrs[_char_idx].attr_control.auto_rsp = ESP_GATT_AUTO_RSP;

    _char_idx++;
}

/**
 * @brief _setup_dis_attrs
 */
static void _setup_dis_attrs()
{
    ESP_LOGD(TAG, "_setup_dis_attrs, gatts_if = %d, service inst _id = %d, ", _service.gatts_if, _service.service_id.id.inst_id);

    // Char decl
    _dis_attrs[_char_idx].att_desc.uuid_length = ESP_UUID_LEN_16;                 /*!< UUID length */
    _dis_attrs[_char_idx].att_desc.uuid_p      = (uint8_t*)&primary_service_uuid; /*!< UUID value */
    _dis_attrs[_char_idx].att_desc.perm        = ESP_GATT_PERM_READ;              /*!< Attribute permission */
    _dis_attrs[_char_idx].att_desc.max_length  = sizeof(uint16_t);                /*!< Maximum length of the element*/
    _dis_attrs[_char_idx].att_desc.length      = sizeof(dis_uuid16);              /*!< Current length of the element*/
    _dis_attrs[_char_idx].att_desc.value       = (uint8_t*)&dis_uuid16;           /*!< Element value array*/

    _dis_attrs[_char_idx].attr_control.auto_rsp = ESP_GATT_AUTO_RSP;

    _char_idx++;

    if (_dis_data.firmware_revision.attr_value != NULL) {
        ESP_LOGD(TAG, "Adding fimrware revision: %s", _dis_data.firmware_revision.attr_value);
        _add_char(&char_prop_read);
        _add_char_value(
            &_dis_data.firmware_revision, ESP_UUID_LEN_16, (uint8_t*)&char_uuid_firmware_revision, ESP_GATT_PERM_READ);
    }

    if (_dis_data.hardware_revision.attr_value != NULL) {
        ESP_LOGD(TAG, "Adding hardware revision: %s", _dis_data.hardware_revision.attr_value);
        _add_char(&char_prop_read);
        _add_char_value(
            &_dis_data.hardware_revision, ESP_UUID_LEN_16, (uint8_t*)&char_uuid_hardware_revision, ESP_GATT_PERM_READ);
    }

    if (_dis_data.manufacturer_name.attr_value != NULL) {
        ESP_LOGD(TAG, "Adding manufacturer: %s", _dis_data.manufacturer_name.attr_value);
        _add_char(&char_prop_read);
        _add_char_value(
            &_dis_data.manufacturer_name, ESP_UUID_LEN_16, (uint8_t*)&char_uuid_manufacturer_name, ESP_GATT_PERM_READ);
    }

    if (_dis_data.software_revision.attr_value != NULL) {
        ESP_LOGD(TAG, "Adding software revision: %s", _dis_data.software_revision.attr_value);
        _add_char(&char_prop_read);
        _add_char_value(
            &_dis_data.software_revision, ESP_UUID_LEN_16, (uint8_t*)&char_uuid_software_revision, ESP_GATT_PERM_READ);
    }

    if (_dis_data.model_number.attr_value != NULL) {
        ESP_LOGD(TAG, "Adding model name/number: %s", _dis_data.model_number.attr_value);
        _add_char(&char_prop_read);
        _add_char_value(&_dis_data.model_number, ESP_UUID_LEN_16, (uint8_t*)&char_uuid_model_number, ESP_GATT_PERM_READ);
    }

    ESP_ERROR_CHECK(esp_ble_gatts_create_attr_tab(_dis_attrs, _service.gatts_if, _char_idx, _service.service_id.id.inst_id));
}

/**
 * @brief dis_init
 * @param profile_id : an ID that will uniquelly identify the service accross the application
 */
void dis_init(uint16_t app_id)
{
    // TODO: make sure the servce is initialized only once

    ESP_LOGD(TAG, "> Device information service <");

    _service.app_id = app_id;
    esp_ble_gatts_app_register(app_id);
}

/**
 * @brief dis_set_model_number
 * @param model_number
 */
void dis_set_model_number(const char* model_number)
{
    ESP_LOGD(TAG, "Model number: %s", model_number);

    _set_char_attr(&_dis_data.model_number, model_number);
}

/**
 * @brief dis_set_model_number
 * @param model_number
 */
void dis_set_manufacturer_name(const char* manufacturer_name)
{
    ESP_LOGD(TAG, "Manufacturer name: %s", manufacturer_name);
    _set_char_attr(&_dis_data.manufacturer_name, manufacturer_name);
}

/**
 * @brief dis_set_hardware_revision
 * @param hardware_revision
 */
void dis_set_hardware_revision(const char* hardware_revision)
{
    ESP_LOGD(TAG, "Hardware revision %s", hardware_revision)
    _set_char_attr(&_dis_data.hardware_revision, hardware_revision);
}

/**
 * @brief dis_software_revision
 * @param software_revision
 */
void dis_software_revision(const char* software_revision)
{
    ESP_LOGD(TAG, "Hardware revision %s", software_revision)
    _set_char_attr(&_dis_data.software_revision, software_revision);
}

/**
 * @brief dis_software_revision
 * @param software_revision
 */
void dis_set_firmware_revision(const char* firmware_revision)
{
    ESP_LOGD(TAG, "Firmware revision %s", firmware_revision)
    _set_char_attr(&_dis_data.firmware_revision, firmware_revision);
}

/**
 * @brief dis_gatts_event_handler
 * @param event
 * @param gatts_if
 * @param param
 */
void dis_gatts_event_handler(esp_gatts_cb_event_t event, esp_gatt_if_t gatts_if, esp_ble_gatts_cb_param_t* param)
{
    esp_err_t err;
    /* If event is register event, store the gatts_if for each profile */
    if (event == ESP_GATTS_REG_EVT && param->reg.status == ESP_GATT_OK && param->reg.app_id == _service.app_id) {
        _service.gatts_if = gatts_if;
    }

    if (gatts_if != _service.gatts_if)
        return;

    switch (event) {
        case ESP_GATTS_REG_EVT:
            ESP_LOGI(TAG, "REGISTER_APP_EVT, status %d, app_id %d", param->reg.status, param->reg.app_id);

            _service.service_id.is_primary          = true;
            _service.service_id.id.inst_id          = 0x00;
            _service.service_id.id.uuid.len         = ESP_UUID_LEN_16;
            _service.service_id.id.uuid.uuid.uuid16 = dis_uuid16;

            _setup_dis_attrs();
            break;

        case ESP_GATTS_CREATE_EVT:

            break;

        case ESP_GATTS_CREAT_ATTR_TAB_EVT:
            ESP_LOGD(TAG,
                     "Attr tab created: Status = 0x%02x, Service handle = 0x%04x, Num handles = %d",
                     param->add_attr_tab.status,
                     param->add_attr_tab.handles[0],
                     param->add_attr_tab.num_handle);

            _service.service_handle = param->add_attr_tab.handles[0];
            esp_ble_gatts_start_service(param->add_attr_tab.handles[0]);

            break;
        case ESP_GATTS_ADD_CHAR_EVT:
            break;
        case ESP_GATTS_ADD_CHAR_DESCR_EVT:
            break;

        case ESP_GATTS_READ_EVT:
            ESP_LOGI(TAG,
                     "GATT_READ_EVT, conn_id %d, trans_id %d, handle %d",
                     param->read.conn_id,
                     param->read.trans_id,
                     param->read.handle);
            break;
        case ESP_GATTS_WRITE_EVT:
            ESP_LOGI(TAG,
                     "GATT_WRITE_EVT, conn_id %d, trans_id %d, handle %d",
                     param->write.conn_id,
                     param->write.trans_id,
                     param->write.handle);
            ESP_LOGI(TAG, "GATT_WRITE_EVT, value len %d, value %08x", param->write.len, *(uint32_t*)param->write.value);
            break;
        case ESP_GATTS_EXEC_WRITE_EVT:
        case ESP_GATTS_MTU_EVT:
        case ESP_GATTS_CONF_EVT:
        case ESP_GATTS_UNREG_EVT:
            break;

        case ESP_GATTS_ADD_INCL_SRVC_EVT:
            break;

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
