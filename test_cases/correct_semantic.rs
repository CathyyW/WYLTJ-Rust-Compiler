fn add(a: i32, b: i32) -> i32 {
  return a + b;
}

fn main() -> i32 {
  let mut total: i32 = 0;
  let values: [i32; 3] = [1, 2, 3];
  let pair: (i32, i32) = (values[0], values[1]);

  total = add(pair.0, pair.1);

  while total < 10 {
    total = total + 1;
  }

  if total >= 10 {
    return total;
  } else {
    return 0;
  }
}

