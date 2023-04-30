import { Divider, Icon, useTheme } from '@ui-kitten/components';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DEFAULT_05x_MARGIN, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN } from '../../utils/constants';

const PaywallFeatureCell = ({ featureTitle, featureDescription }: { featureTitle: string, featureDescription: string, }) => {

    const theme = useTheme();

    return (
        <View style={styles().featureContainer}>
            <View style={styles().featureTextAndIcon}>
                <View style={{ ...styles().iconContainer }}>
                    <MaterialCommunityIcons name={'check-bold'} size={13} color={theme['button-text-color']} />
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
            paddingVertical: DEFAULT_1x_MARGIN
        },
        featureTextAndIcon: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        iconContainer: {
            marginRight: 10,
            borderRadius: 100,
            padding: 4,
            backgroundColor: 'rgb(84,182,133)'
        },
        featureTitle: {
            fontWeight: '600',
            fontSize: 15,
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
            flex: 1
        }
    })
}

export default PaywallFeatureCell