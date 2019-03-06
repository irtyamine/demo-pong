#
# This is a project Makefile. It is assumed the directory this Makefile resides in is a
# project subdirectory.
#


FW_VERSION_MAJOR=0
FW_VERSION_MINOR=0
FW_VERSION_PATCH=1
FW_VERSION_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "-------")

PROJECT_NAME := k-pong-remote-$(FW_VERSION_MAJOR).$(FW_VERSION_MINOR).$(FW_VERSION_PATCH)-$(FW_VERSION_COMMIT)

EXTRA_COMPONENT_DIRS += $(PROJECT_PATH)/../components $(PROJECT_PATH)/../esp32-components

CFLAGS += -D FW_VERSION_MAJOR=$(FW_VERSION_MAJOR) -D FW_VERSION_MINOR=$(FW_VERSION_MINOR) -D FW_VERSION_PATCH=$(FW_VERSION_PATCH) -D FW_VERSION_COMMIT='"$(FW_VERSION_COMMIT)"'

include $(IDF_PATH)/make/project.mk

