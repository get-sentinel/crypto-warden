import { Text } from "@ui-kitten/components"
import React from "react"
import { View } from "react-native"
import { BaseToast } from "react-native-toast-message"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { DESKTOP, TAB_ICON_SIZE } from "../utils/constants"
import { isSmallScreen } from "../utils/utils"
import DeviceInfo from "react-native-device-info"

let deviceType = DeviceInfo.getDeviceType();

export const getToastConfig = (theme: Record<string, string>) => {
    return {
        success: ({ ...rest }: any) => (
            <BaseToast
                {...rest}
                style={{
                    backgroundColor: theme['toast-background-color'],
                    marginBottom: 0,
                    borderLeftWidth: 0,
                    borderRadius: 10
                    // height: 70, // deviceType === HANDSET ? 65 : 65,
                    // width: '90%'
                }}
                contentContainerStyle={{ paddingHorizontal: 15, display: 'flex', justifyContent: 'center', alignItems: 'center'}}
                text1Style={{
                    color: theme['toast-text-color'],
                    fontSize: deviceType === DESKTOP ? 16 : 14,
                    // marginBottom: 5
                }}
                text2Style={{
                    color: theme['toast-text-color'],
                    fontSize: deviceType === DESKTOP ? 13 : 11,
                }}
                renderLeadingIcon={() => <MaterialCommunityIcons size={TAB_ICON_SIZE} style={{ alignSelf: 'center', marginLeft: 15 }} color={theme['color-primary-500']} name={{ ...rest }.props.iconName} />}
                trailingIcon={null}
            />
        )
    }
}
