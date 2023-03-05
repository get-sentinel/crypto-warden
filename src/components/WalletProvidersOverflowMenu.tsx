/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { Fragment, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    Button, Icon,
    Text,
    useTheme, Modal, Card, Spinner, Divider, OverflowMenu, MenuItem
} from '@ui-kitten/components';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_CORNER_RADIUS, WALLET_PROVIDERS } from '../utils/constants';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { getProviderName } from '../utils/utils';

const WalletProvidersOverflowMenu = ({ providerMenuVisible, toggleProviderMenu, selectedProvider, setProviderMenuVisible, setSelectedProvider, overflowStyle, fullWidth = false, itemStyle, selectProvider}: { providerMenuVisible: boolean, toggleProviderMenu: () => void, selectedProvider: number, setProviderMenuVisible: (visible: boolean) => void, setSelectedProvider?: (provider: number) => void, overflowStyle: any, fullWidth?: boolean, itemStyle: any, selectProvider: (provider: number) => void}) => {

    const theme = useTheme();
    const deviceType = useSelector((state: any) => state.deviceType);
    const dispatch = useDispatch()

    return (
        <Fragment>
            <OverflowMenu
                anchor={() => {
                    return <View style={{ flex: 1, borderWidth: 0, display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', backgroundColor: theme['color-basic-800'], height: 40, borderRadius: DEFAULT_CORNER_RADIUS }}>
                        <TouchableOpacity style={{ flex: 1, borderWidth: 0, display: 'flex', justifyContent: 'flex-start', flexDirection: 'row', alignItems: 'center' }} onPress={() => toggleProviderMenu()}>
                            <Text ellipsizeMode='tail' numberOfLines={1} style={{ fontSize: 16, fontWeight: '400', paddingLeft: 5 }}>
                                {getProviderName(selectedProvider)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                }}
                visible={providerMenuVisible}
                style={overflowStyle}
                fullWidth={fullWidth}
                onBackdropPress={() => toggleProviderMenu()}>
                {WALLET_PROVIDERS.map((provider:{id:number, name:string}) => <MenuItem
                    key={provider.id}
                    title={(props: any) => <Text {...props} ellipsizeMode='tail' numberOfLines={1} style={styles(theme, deviceType).menuItem}>{provider.name}</Text>}
                    style={itemStyle}
                    onPress={() => selectProvider(provider.id)} />)}

            </OverflowMenu>
        </Fragment>

    );
};

const styles = (theme: Record<string, string>, deviceType?: string) => StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItem: {
        color: theme['text-basic-color'],
        width: '100%',
        paddingLeft: 5,
        fontSize: 14,
        fontWeight: '600'
    }
});

export default WalletProvidersOverflowMenu;