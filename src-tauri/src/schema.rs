// @generated automatically by Diesel CLI.

diesel::table! {
    card (id) {
        id -> Integer,
        title -> Text,
        description -> Text,
        stack_id -> Nullable<Integer>,
        latitude -> Nullable<Float>,
        longitude -> Nullable<Float>,
        radius -> Nullable<Float>,
        icon_name -> Nullable<Text>,
        region_image_id -> Nullable<Integer>,
    }
}

diesel::table! {
    card_old (id) {
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
        last_used -> Nullable<Integer>,
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

diesel::joinable!(card -> image (region_image_id));
diesel::joinable!(card -> stack (stack_id));
diesel::joinable!(card_old -> image (region_image_id));
diesel::joinable!(card_old -> stack (stack_id));

diesel::allow_tables_to_appear_in_same_query!(
    card,
    card_old,
    image,
    marker,
    stack,
);
