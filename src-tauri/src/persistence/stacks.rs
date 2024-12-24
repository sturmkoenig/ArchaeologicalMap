use crate::diesel::RunQueryDsl;
use app::{
    last_insert_rowid,
    models::{NewStack, Stack},
    schema::{
        self,
        cards::{self},
        stack,
    },
};
use diesel::expression_methods::ExpressionMethods;
use diesel::{select, QueryDsl, SqliteConnection};
use app::schema::stack::id;

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

pub fn query_stack_by_id(conn: &mut SqliteConnection, stack_id: i32) -> Stack {
    stack::table.find(stack_id)
        .first(conn)
        .expect(&format!("could not load the stack with stackId {}", stack_id))
}

pub fn query_delete_stack(conn: &mut SqliteConnection, stack_id: i32) {
    let result = diesel::update(cards::table)
        .filter(schema::cards::stack_id.eq(stack_id))
        .set(cards::stack_id.eq(None::<i32>))
        .execute(conn);
    if let Err(e) = result {
        panic!(
            "Error setting card stackId {} to None produced error: {}, ",
            stack_id, e
        )
    }

    let result = diesel::delete(stack::table.filter(stack::id.eq(stack_id))).execute(conn);
    if let Err(e) = result {
        panic!(
            "Error deleting stack with id: {}, produced error {}",
            stack_id, e
        )
    }
}
