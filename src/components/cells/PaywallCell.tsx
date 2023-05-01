import { Divider, Icon, useTheme } from '@ui-kitten/components';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DEFAULT_05x_MARGIN, DEFAULT_15_MARGIN, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_CORNER_RADIUS } from '../../utils/constants';

const PaywallCell = ({ paywallOptionPrice, paywallOption, paywallOptionDescription, selected, discount, onPress }: { paywallOptionPrice: string, paywallOption: string, paywallOptionDescription: string, selected: boolean, discount?: string, onPress: () => void }) => {

    const theme = useTheme();

    return (
        <TouchableOpacity onPress={() => onPress()} style={styles().cellContainer}>

            <View style={styles().cellHeader}>
                <MaterialCommunityIcons
                    name={selected ? 'circle' : 'circle-outline'}
                    size={24}
                    color={selected ? theme['color-primary-500'] : theme['icon-inactive-color']} />

                <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                    <Text style={styles().optionText}>
                        {paywallOption + ': ' + paywallOptionPrice}
                    </Text>
                    <Text style={styles().optionDescriptionText}>
                        {paywallOptionDescription}
                    </Text>
                </View>

            </View>
            {
                discount
                    ? <View style={styles().discountCell}>
                        <Text style={styles().discountText}>
                            {discount}
                        </Text>
                    </View>
                    : undefined
            }

        </TouchableOpacity>

    )
}

const styles = () => {
    const theme = useTheme();

    return StyleSheet.create({
        cellContainer: {
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: DEFAULT_1x_MARGIN,
            flexDirection: 'row',
            width: '100%'
        },
        cellHeader: {
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            paddingVertical: DEFAULT_15_MARGIN
        },
        optionText: {
            color: theme['text-basic-color'],
            fontSize: 15,
            textAlign: 'center',
            fontWeight: '600',
            marginLeft: DEFAULT_2x_MARGIN
        },
        optionDescriptionText: {
            color: theme['secondary-text'],
            fontSize: 13,
            textAlign: 'center',
            fontWeight: '400',
            marginLeft: DEFAULT_2x_MARGIN
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

export default PaywallCell