import { View, Text } from "react-native";
import Feather from '@expo/vector-icons/Feather';

const FoodListItem = ({ item }) => {
    return (
        <View
            style={{
                backgroundColor: 'gainsboro',
                padding: 10,
                borderRadius: 5,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <View style={{ flex: 1, gap: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.label}</Text>
                <Text style={{ fontSize: 14, color: 'dimgray' }}>{item.cal} cal, {item.brand}</Text>
            </View>
            <Feather name="plus-circle" size={24} color="royalblue" />
        </View>
    );
};

export default FoodListItem;