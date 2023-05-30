import { useTheme } from '@ui-kitten/components';
import React from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_PADDING } from '../../utils/constants';

const ModalSafeArea = (props: any) => {

    const theme = useTheme();

    return (
        <View
            style={{
                padding: DEFAULT_PADDING,
                backgroundColor: theme['color-basic-500'],
                flex: 1,
                paddingTop: Platform.OS === 'android' ? 50 : undefined
            }}
        >
            {props.children}
        </View>)
}

export default ModalSafeArea;