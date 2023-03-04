// @generated automatically by Diesel CLI.

diesel::table! {
    cards (id) {
        id -> Integer,
        title -> Text,
        category -> Text,
        description -> Text,
        longitude -> Float,
        latitude -> Float,
        coordinate_radius -> Float,
    }
}
