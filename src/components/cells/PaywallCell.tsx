import { Divider, Icon, useTheme } from '@ui-kitten/components';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DEFAULT_05x_MARGIN, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_CORNER_RADIUS } from '../../utils/constants';

const PaywallCell = ({ paywallOptionPrice, paywallOption, selected, discount, onPress }: { paywallOptionPrice: string, paywallOption: string, selected: boolean, discount?: string, onPress: () => void }) => {

    const theme = useTheme();

    return (
        <TouchableOpacity onPress={() => onPress()} style={styles().cellContainer}>

            <View style={styles().cellHeader}>
                <MaterialCommunityIcons
                    name={selected ? 'check-circle' : 'circle-outline'}
                    size={24}
                    color={selected ? theme['color-primary-500'] : theme['icon-inactive-color']} />

                <Text style={styles().optionText}>
                    {paywallOption}
                </Text>
                {
                    discount
                        ? <View style={styles().discountCell}>
                            <Text style={styles().discountText}>
                                {discount}
                            </Text>
                        </View>
                        : undefined
                }
            </View>

            <Text style={styles().optionPriceText}>
                {paywallOptionPrice}
            </Text>

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
            paddingVertical: DEFAULT_2x_MARGIN
        },
        optionText: {
            color: theme['text-basic-color'],
            fontSize: 16,
            textAlign: 'center',
            fontWeight: '600',
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
            marginLeft:10
        },
        discountText: {
            color: theme['text-primary-color-button'],
            fontSize: 14,
            fontWeight: '600'
        }
    })
}

export default PaywallCell