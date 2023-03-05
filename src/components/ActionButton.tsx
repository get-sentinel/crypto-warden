import React from 'react';
import {
    StyleSheet,
    TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ActionButton = ({ action, icon }: { action: () => void, icon:string }) => {

    return (
        <View style={style.container}>
            <TouchableOpacity style={style.button} onPress={() => action()}>
                <MaterialCommunityIcons name={icon} size={20} color={'#fff'} />
            </TouchableOpacity>
        </View>
    )
}

const style = StyleSheet.create({
    container: {
        display: 'flex'
    },
    button: {
        padding: 0,
        borderRadius: 100,
        height: 35,
        width: 35,
        backgroundColor: '#444',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }
})

export default ActionButton