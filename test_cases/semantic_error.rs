fn add(a: i32, b: i32) -> i32 {
  return a + b;
}

fn main() -> i32 {
  let x: i32 = 3;
  let mut y: i32 = 4;

  x = y;
  y = add(x);

  if y {
    return y;
  }

  return 1.5;
}

