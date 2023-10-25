// @generated automatically by Diesel CLI.

diesel::table! {
    cards (id) {
        id -> Integer,
        title -> Text,
        description -> Text,
        stack_id -> Nullable<Integer>,
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

diesel::table! {
    stack (id) {
        id -> Integer,
        name -> Text,
        image_name -> Text,
    }
}

diesel::joinable!(cards -> stack (stack_id));
diesel::joinable!(marker -> cards (card_id));

diesel::allow_tables_to_appear_in_same_query!(
    cards,
    marker,
    stack,
);
