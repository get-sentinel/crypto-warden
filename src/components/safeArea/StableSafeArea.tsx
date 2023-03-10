import { useTheme } from '@ui-kitten/components';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StableSafeArea =  (props: any) => {

    const insets = useSafeAreaInsets();
    const theme = useTheme();

    return (
        <View
            style={{
                backgroundColor: props.bg !== undefined ? props.bg : theme['color-basic-500'],
                // flex: 1,
                height: '100%',
                width: '100%',
                paddingTop: insets.top,
                paddingBottom: 0,
                paddingLeft: insets.left,
                paddingRight: insets.right
            }}
        >
            {props.children}
        </View>)
}

export default StableSafeArea;