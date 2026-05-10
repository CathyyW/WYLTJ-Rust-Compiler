// Grammar-aligned samples (ASCII only)

// 1.1 Basic program
fn program_1_1() {
}

// 1.2 Empty statement
fn program_1_2() {
  ;
}

// 1.3 Return statement (empty)
fn program_1_3() {
  return;
}

// 1.4 Function input (param with type, optional mut)
fn program_1_4(mut a: i32) {
  return;
}

// 1.5 Function output (return type + return expr)
fn program_1_5(a: i32) -> i32 {
  return a;
}

// 2.0 Variable declaration (with and without type)
fn program_2_0() {
  let mut a;
  let b: i32;
}

// 2.1 Variable declaration statement
fn program_2_1() {
  let mut a;
  let mut b: i32;
}

// 2.2 Assignment statement
fn program_2_2(mut a: i32) {
  a = 32;
}

// 2.3 Declaration with assignment
fn program_2_3() {
  let mut a = 1;
  let mut b: i32 = 1;
}

// 3.1 Basic expressions
fn program_3_1_1() {
  0;
  (1);
  ((2));
  (((3)));
}

fn program_3_1_2(mut a: i32) {
  a;
  (a);
  ((a));
  (((a)));
}

// 3.2 Comparisons
fn program_3_2() {
  1 < 2;
  3 > 4;
  5 <= 6;
  7 >= 8;
  9 == 10;
  11 != 12;
}

// 3.3 Add/Sub
fn program_3_3() {
  1 + 2;
  3 - 4;
}

// 3.4 Mul/Div
fn program_3_4() {
  1 * 2;
  3 / 4;
}

// 3.5 Function call
fn program_3_5_1() {
  program_3_5_2();
}

fn program_3_5_2() {
  program_3_5_1();
}

// 4.1 if
fn program_4_1(a: i32) -> i32 {
  if a > 0 {
    return 1;
  }
  return 0;
}

// 4.2 if-else
fn program_4_2(a: i32) -> i32 {
  if a > 0 {
    return 1;
  } else {
    return 0;
  }
}

// 4.3 if-else if-else
fn program_4_3(a: i32) -> i32 {
  if a > 0 {
    return a + 1;
  } else if a < 0 {
    return a - 1;
  } else {
    return 0;
  }
}

// 5.1 while
fn program_5_1(mut n: i32) {
  while n > 0 {
    n = n - 1;
  }
}

// 5.2 for (range iterator)
fn program_5_2(mut n: i32) {
  for mut i: i32 in 1 .. n {
    n = n - 1;
  }
}

// 5.3 loop
fn program_5_3() {
  loop {
    break;
  }
}

// 5.4 break/continue
fn program_5_4() {
  while 1 == 0 {
    continue;
  }
  while 1 == 1 {
    break;
  }
}

// End marker
#
