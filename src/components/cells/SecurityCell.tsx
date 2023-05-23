import { Divider, Icon, Input, useTheme, Button, } from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BUTTON_FONT_SIZE, DEFAULT_05x_MARGIN, DEFAULT_15_MARGIN, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN, DEFAULT_CORNER_RADIUS, SECURITY_OPTIONS } from '../../utils/constants';
import { useSelector } from 'react-redux';

const SecurityCell = ({ title, description, selected, sync, alert, securityOption, onPress, newPassword, setNewPassword, iconName }: { title: string, description: string, selected: boolean, sync: string, alert?: string, securityOption: string, onPress: () => void, newPassword?: string, setNewPassword?: (value: string) => void, iconName: string }) => {

    const theme = useTheme();
    const password = useSelector((state: any) => state.accountSlice.password);
    const [isPassowordVisible, setIsPasswordVisible] = useState(false)

    useEffect(() => {
        if (!selected) {
            setIsPasswordVisible(false)
            setNewPassword?.(password)
        }

    }, [selected])

    const updatePassword = () => {

    }

    return (
        <View style={{
            paddingHorizontal: DEFAULT_1x_MARGIN,
            paddingVertical: DEFAULT_15_MARGIN,
            backgroundColor: theme['color-basic-600'],
            borderRadius: DEFAULT_CORNER_RADIUS,
            marginBottom: DEFAULT_1x_MARGIN,
            marginTop: DEFAULT_3x_MARGIN,
            borderWidth: 2,
            borderColor: selected ? theme['color-primary-500'] : theme['color-basic-600'],
        }}>
            <TouchableOpacity onPress={() => onPress()} style={styles().cellContainer}>

                <View style={styles().cellHeader}>

                    <View style={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
                            <MaterialCommunityIcons size={20}
                                color={theme['text-basic-color']}
                                name={iconName} />
                            <Text style={{ ...styles().optionText, ...{ color: theme['text-basic-color'], marginLeft:DEFAULT_1x_MARGIN } }}>
                                {title}
                            </Text>
                        </View>

                        <Text style={styles().optionDescriptionText}>
                            {description}
                        </Text>

                        <Text style={{ ...styles().optionDescriptionText, ...{ color: theme['text-basic-color'], fontSize: 12 } }}>
                            {`Syncing: ${sync}`}
                        </Text>


                    </View>

                </View>

                {
                    alert
                        ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%', marginTop: DEFAULT_2x_MARGIN }}>
                            <MaterialCommunityIcons
                                name={'shield-alert-outline'}
                                size={23}
                                color={theme['text-basic-color']} />
                            <Text style={styles().alertDescriptionText}>
                                {alert}
                            </Text>
                        </View>
                        : undefined
                }

            </TouchableOpacity>

            {
                securityOption === SECURITY_OPTIONS.SENTINEL
                    ? <View style={{ marginTop: DEFAULT_3x_MARGIN, flex: 1, }}>
                        <Text style={{ color: theme['text-basic-color'], marginBottom: DEFAULT_15_MARGIN, fontSize: 11 }}>
                            {"Encryption Password (only saved locally)"}
                        </Text>
                        <Input
                            value={newPassword}
                            caption=''
                            disabled={!selected}
                            size='medium'
                            secureTextEntry={!isPassowordVisible}
                            style={{ paddingHorizontal: 0, paddingVertical: 0, backgroundColor: theme['color-basic-500'], borderWidth: 0, borderColor: theme['color-basic-300'], borderRadius: 8, }}
                            onChangeText={(nextValue: string) => setNewPassword?.(nextValue)}
                            accessoryRight={() => <TouchableOpacity onPress={() => setIsPasswordVisible(!isPassowordVisible)}>
                                <MaterialCommunityIcons size={20}
                                    color={theme['text-primary-color-button']}
                                    name={isPassowordVisible ? 'eye' : 'eye-off'} />
                            </TouchableOpacity>
                            }
                        />
                    </View>
                    : undefined
            }
        </View>

    )
}

const styles = () => {
    const theme = useTheme();

    return StyleSheet.create({
        cellContainer: {
            justifyContent: 'space-between',
            alignItems: 'center',
            // flexDirection: 'row',
        },
        cellHeader: {
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            width: '100%',
        },
        optionText: {
            fontSize: 18,
            textAlign: 'center',
            fontWeight: '600',
        },
        optionDescriptionText: {
            color: theme['secondary-text'],
            fontSize: 13,
            textAlign: 'left',
            fontWeight: '400',
            marginTop: 8,
        },
        alertDescriptionText: {
            color: theme['secondary-text'],
            fontSize: 13,
            textAlign: 'left',
            fontWeight: '400',
            marginLeft: 8,
            maxWidth: '90%'
        },
        optionPriceText: {
            color: theme['secondary-text'],
            fontSize: 16,
            textAlign: 'center',
            fontWeight: '500'
        },
        discountCell: {
            padding: DEFAULT_05x_MARGIN,
            backgroundColor: theme['color-primary-500'],
            borderRadius: 5,
            marginLeft: 10
        },
        discountText: {
            color: theme['button-text-color'],
            fontSize: 12,
            fontWeight: '600'
        }
    })
}

export default SecurityCell