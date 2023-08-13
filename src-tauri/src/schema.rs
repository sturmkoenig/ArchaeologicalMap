// @generated automatically by Diesel CLI.

diesel::table! {
    cards (id) {
        id -> Integer,
        title -> Text,
        description -> Text,
        catalogue_id -> Integer,
    }
}

diesel::table! {
    catalogue (id) {
        id -> Integer,
        name -> Text,
        icon_url -> Text,
    }
}

diesel::table! {
    marker (id) {
        id -> Integer,
        card_id -> Integer,
        latitude -> Float,
        longitude -> Float,
        radius -> Float,
        icon_name -> Text,
    }
}

diesel::joinable!(cards -> catalogue (catalogue_id));
diesel::joinable!(marker -> cards (card_id));

diesel::allow_tables_to_appear_in_same_query!(
    cards,
    catalogue,
    marker,
);
