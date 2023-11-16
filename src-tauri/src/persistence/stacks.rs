use crate::diesel::RunQueryDsl;
use app::{
    last_insert_rowid,
    models::{NewStack, Stack, StackDTO},
    schema::{self, marker::icon_name, stack},
};
use diesel::expression_methods::ExpressionMethods;
use diesel::{select, QueryDsl, SqliteConnection};

pub fn query_create_stack(conn: &mut SqliteConnection, new_stack: &NewStack) -> Stack {
    diesel::insert_into(stack::table)
        .values(new_stack)
        .execute(conn)
        .expect("error inserting new stack entry");

    let stack_id = select(last_insert_rowid())
        .first(conn)
        .expect("error getting id");

    Stack {
        id: stack_id,
        name: new_stack.name.clone(),
        image_name: new_stack.image_name.clone(),
    }
}
pub fn query_update_stack(conn: &mut SqliteConnection, updated_stack: &Stack) -> Stack {
    diesel::update(stack::table)
        .filter(schema::stack::id.eq(updated_stack.id))
        .set(updated_stack)
        .execute(conn)
        .expect("Error while updating stack");
    stack::table
        .filter(schema::stack::id.eq(updated_stack.id))
        .first(conn)
        .expect("error reading stack")
}

pub fn query_all_stacks(conn: &mut SqliteConnection) -> Vec<Stack> {
    stack::table
        .load::<Stack>(conn)
        .expect("could not load all stacks from database")
}
