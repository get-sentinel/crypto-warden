import { Divider, Icon, useTheme } from '@ui-kitten/components';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DEFAULT_05x_MARGIN, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN } from '../../utils/constants';

const PaywallFeatureCell = ({ headingIcon, featureTitle, featureDescription, iconBackgroundColor, iconColor = '#fff' }: { headingIcon: string, iconBackgroundColor: string, featureTitle: string, featureDescription: string, iconColor?: string}) => {

    const theme = useTheme();

    return (
        <View style={styles().featureContainer}>
            <View style={styles().featureTextAndIcon}>
                <View style={{ ...styles().iconContainer, ...{ backgroundColor: iconBackgroundColor } }}>
                    <MaterialCommunityIcons name={headingIcon} size={20} color={iconColor} />
                </View>

                <View style={styles().textContainer}>
                    <Text style={styles().featureTitle}>{featureTitle}</Text>
                    <Text style={styles().featureDescription}>{featureDescription}</Text>
                </View>
            </View>
        </View>
    )
}

const styles = () => {
    const theme = useTheme();

    return StyleSheet.create({
        featureContainer: {
            display: 'flex',
            width: '100%',
            // height: 55,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            paddingHorizontal: DEFAULT_2x_MARGIN,
            paddingVertical: DEFAULT_2x_MARGIN
        },
        featureTextAndIcon: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        iconContainer: {
            marginRight: 10,
            borderRadius: 5,
            padding: 4
        },
        featureTitle: {
            fontWeight: '700',
            fontSize: 16,
            color: theme['text-basic-color']
        },
        featureDescription: {
            fontSize: 14,
            color: theme['secondary-text']
        },
        settingsItemIcon: {
            width: 20,
            height: 20
        },
        textContainer: {
            flex:1
        }
    })
}

export default PaywallFeatureCell