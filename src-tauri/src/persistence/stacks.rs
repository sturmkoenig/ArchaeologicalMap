use crate::diesel::RunQueryDsl;
use app::{
    models::{NewStack, Stack, StackDTO},
    schema::{marker::icon_name, stack},
};
use diesel::SqliteConnection;

pub fn query_create_stack(conn: &mut SqliteConnection, new_stack: &NewStack) {
    diesel::insert_into(stack::table)
        .values(new_stack)
        .execute(conn)
        .expect("error inserting new stack entry");
}

pub fn query_all_stacks(conn: &mut SqliteConnection) -> Vec<Stack> {
    stack::table
        .load::<Stack>(conn)
        .expect("could not load all stacks from database")
}
