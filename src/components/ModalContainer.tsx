import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@ui-kitten/components";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
    Button
} from '@ui-kitten/components';
import { isSmallScreen } from "../utils/utils";
import { globalStyles } from "../utils/globalStyles";
import { DEFAULT_PADDING, TOP_NAV_TITLE_SIZE, TOP_NAV_TITLE_WEIGHT } from "../utils/constants";
import Toast from "react-native-toast-message";
import { getToastConfig } from "../config/ToastConfig";

const ModalContainer = (props: any) => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    return (
        <View style={{ flex: 1, backgroundColor: theme['color-basic-600'] }}>
            <View style={{
                ...styles.backButtonContainer, ...{
                    justifyContent: props.title ? 'space-between' : 'flex-end',
                }
            }}>
                {props.title ? <Text style={{ fontWeight: TOP_NAV_TITLE_WEIGHT, fontSize: TOP_NAV_TITLE_SIZE, color: theme['text-basic-color'] }}> {props.title} </Text> : undefined}
                <MaterialCommunityIcons onPress={() => navigation.goBack()} style={{ alignSelf: 'flex-end', }} name="close" size={25} color={theme['text-basic-color']} />
            </View>

            <View style={{ display: 'flex', paddingHorizontal: DEFAULT_PADDING }}>
                {props.children}
            </View>

            {props.actionButtonTitle && props.actionButtonMethod ?
                <View style={{
                    ...styles.actionButtonContainer, ...{
                        borderTopColor: theme['shadow-color'], backgroundColor: theme['color-basic-600']
                    }
                }}>
                    <Button style={globalStyles(theme).cancelButton}
                        onPress={() => navigation.goBack()}>
                        {props => <Text {...props} style={{
                            color: theme['text-basic-color'], textAlign: 'center', fontWeight: '600',
                        }}>{`Cancel`}</Text>
                        }
                    </Button>
                    <Button style={globalStyles(theme).primaryButton}
                        onPress={() => props.actionButtonMethod()}>
                        {
                            p => <Text {...p} style={{
                                color: theme['text-primary-color-button'], textAlign: 'center', fontWeight: '600',
                            }}> {props.actionButtonTitle} </Text>
                        }
                    </Button>
                </View>
                : undefined
            }
            <Toast config={getToastConfig(theme)} />
        </View>
    );
};

const styles = StyleSheet.create({
    backButtonContainer: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        margin: DEFAULT_PADDING,
        marginBottom: 10
    },
    actionButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        paddingBottom: isSmallScreen() ? 15 : 30,
        borderTopWidth: 1,
        paddingTop: 15,
        zIndex: 100,

    }
})

export default ModalContainer;