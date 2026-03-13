import { View, Text, StyleSheet } from "react-native";
import Feather from '@expo/vector-icons/Feather';

const FoodListItem = ({ item }) => {
    return (
        <View style={styles.container}>
            <View style={{ flex: 1, gap: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.label}</Text>
                <Text style={{ fontSize: 14, color: 'dimgray' }}>{item.cal} cal, {item.brand}</Text>
            </View>
            <Feather name="plus-circle" size={24} color="royalblue" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f6f6f8',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    }
})


export default FoodListItem;