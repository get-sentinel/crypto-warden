import { Divider, Icon, useTheme } from '@ui-kitten/components';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SettingsCell = ({ headingIcon, trailingIcon, iconBackgroundColor, iconColor='#fff', text, onPress }: { headingIcon: string, trailingIcon: string, iconBackgroundColor: string, iconColor?: string, text: string, onPress: () => void }) => {

    const theme = useTheme();

    return (
        <TouchableOpacity style={styles().settingsItem}
            onPress={() => onPress()}>
            <View style={styles().settingsTextAndIcon}>
                <View style={{ ...styles().iconContainer, ...{ backgroundColor: iconBackgroundColor } }}>
                    <MaterialCommunityIcons name={headingIcon} size={16} color={iconColor} />
                </View>
                <Text style={styles().settingsText}>{text}</Text>
            </View>
            <Icon name={trailingIcon} fill={theme['text-basic-color']} style={styles().settingsItemIcon} />
        </TouchableOpacity>
    )
}

const styles = () => {
    const theme = useTheme();

    return StyleSheet.create({
        settingsItem: {
            display: 'flex',
            width: '100%',
            height: 55,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            paddingHorizontal: 15,
        },
        settingsTextAndIcon: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        iconContainer: {
            marginRight: 10,
            borderRadius: 5,
            padding: 5
        },
        settingsText: {
            // fontWeight: '500',
            fontSize: 17,
            color: theme['text-basic-color']
        },
        settingsItemIcon: {
            width: 20,
            height: 20
        },
    })
}

export default SettingsCell