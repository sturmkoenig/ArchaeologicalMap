// @generated automatically by Diesel CLI.

diesel::table! {
    card_new (id) {
        id -> Integer,
        title -> Text,
        description -> Text,
        stack_id -> Nullable<Integer>,
        latitude -> Float,
        longitude -> Float,
        radius -> Float,
        icon_name -> Text,
    }
}

diesel::table! {
    cards (id) {
        id -> Integer,
        title -> Text,
        description -> Text,
        stack_id -> Nullable<Integer>,
        region_image_id -> Nullable<Integer>,
    }
}

diesel::table! {
    image (id) {
        id -> Integer,
        name -> Text,
        image_source -> Text,
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
    marker_old (id) {
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

diesel::joinable!(card_new -> stack (stack_id));
diesel::joinable!(cards -> image (region_image_id));
diesel::joinable!(cards -> stack (stack_id));
diesel::joinable!(marker -> cards (card_id));

diesel::allow_tables_to_appear_in_same_query!(
    card_new,
    cards,
    image,
    marker,
    marker_old,
    stack,
);
