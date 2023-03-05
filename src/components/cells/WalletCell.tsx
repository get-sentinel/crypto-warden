import { Divider, useTheme } from '@ui-kitten/components';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Wallet from '../../class/Wallet';
import { cropWalletAddress, getProviderName } from '../../utils/utils';

const walletCell = ({ item, shouldDisplayDivider = true, onPress }: { item: Wallet, shouldDisplayDivider: boolean, onPress: () => void }) => {

    const theme = useTheme();

    return (
        <TouchableOpacity onPress={onPress} style={styles.walletCell} key={item.address}>

            <Image style={styles.walletIcon}
                source={item.image} />

            <View style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                width: '100%',

            }}>
                <View style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Text style={{ ...styles.walletName, ...{ color: theme['text-basic-color'] } }}>{item.name}</Text>
                    {item.address ? <Text style={{ ...styles.walletAddress, ...{ color: theme['color-basic-400'] } }}>{cropWalletAddress(item.address!)}</Text> : undefined}
                </View>
                {
                    shouldDisplayDivider ? <Divider style={{ backgroundColor: theme['color-basic-300'], width: '100%' }} /> : undefined
                }
            </View>

        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    walletCell: {
        height: 60,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 10
    },
    walletIcon: {
        width: 32,
        height: 32,
        borderRadius: 5,
        marginRight: 15
    },
    walletName: {
        fontSize: 17,
        fontWeight: '400'
    },
    walletAddress: {
        fontSize: 13,
    }
})

export default walletCell