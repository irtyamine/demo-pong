#ifndef __BLE_DIS_H_
#define __BLE_DIS_H_

void dis_init(uint16_t app_id);

void dis_gatts_event_handler(esp_gatts_cb_event_t event, esp_gatt_if_t gatts_if, esp_ble_gatts_cb_param_t *param);

void dis_set_model_number(const char* model_number);
void dis_set_manufacturer_name(const char* manufacturer_name);
void dis_set_hardware_revision(const char* hardware_revision);
void dis_set_software_revision(const char* software_revision);
void dis_set_firmware_revision(const char* software_revision);

#endif // __BLE_DIS_H_
