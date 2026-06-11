# PPT Test Matrix

Source: `【Rust版】大作业2：中间代码生成器.pptx`

Legend:

- Pass: the sample should compile without lexical, syntax, or semantic errors.
- Error: the sample is marked invalid in the PPT or is the normalized form of a PPT invalid case.

| ID | Rule | Expected | Sample |
| --- | --- | --- | --- |
| program_1_1 | 1.1 basic program | Pass | `fn program_1_1() {}` |
| program_1_2 | 1.2 empty statements | Pass | `fn program_1_2() { ;;;;;; }` |
| program_1_3 | 1.3 empty return | Pass | `fn program_1_3() { return ; }` |
| program_1_4 | 1.4 function input | Pass | `fn program_1_4(mut a:i32) {}` |
| program_1_5__1 | 1.5 return value | Pass | `fn program_1_5__1() -> i32 { return 1; }` |
| program_1_5__2 | 1.5 return mismatch | Error | `fn program_1_5__2() -> i32 { return ; }` |
| program_1_5__3 | 1.5 return mismatch | Error | `fn program_1_5__3() { return 1; }` |
| program_2_1__1 | 2.1 declaration with type | Pass | `fn program_2_1__1() { let mut a:i32; }` |
| program_2_1__2 | 2.1 inferred by assignment | Pass | `fn program_2_1__2() { let mut b; b=1; }` |
| program_2_1__3 | 2.1 cannot infer type | Error | `fn program_2_1__3() { let mut b; }` |
| program_2_1__4 | 2.1 shadowing | Pass | `fn program_2_1__4() { let mut a:i32; a=1; let mut a:i32; a=2; }` |
| program_2_2__1 | 2.2 assignment | Pass | `fn program_2_2__1(mut a:i32) { a=32; }` |
| program_2_2__2 | 2.2 undeclared variable | Error | `fn program_2_2__2() { a=32; }` |
| program_2_2__3 | 2.2 type mismatch | Error | `fn program_2_2__3(mut a:i32) { a=1==1; }` |
| program_2_2__4 | 2.2 undeclared RHS | Error | `fn program_2_2__4() { let mut b:i32=a; }` |
| program_2_2__5 | 2.2 unassigned RHS | Error | `fn program_2_2__5() { let mut a:i32; let mut b:i32=a; }` |
| program_2_3__1 | 2.3 declaration initialization | Pass | `fn program_2_3__1() { let mut a:i32=1; let mut b=1; }` |
| program_2_3__2 | 2.3 shadowing with initialization | Pass | `fn program_2_3__2() { let mut a:i32=1; let mut a=2; let mut a:i32=3; }` |
| program_3_1__1 | 3.1 literals and grouping | Pass | `fn program_3_1__1() { 0; (1); ((2)); (((3))); }` |
| program_3_1__2 | 3.1 identifiers and grouping | Pass | `fn program_3_1__2(mut a:i32) { a; (a); ((a)); (((a))); }` |
| program_3_2 | 3.2 comparison | Pass | `fn program_3_2() { 1<2; 3<=4; 5>6; 7>=8; 9==10; 11!=12; }` |
| program_3_3 | 3.3 addition/subtraction | Pass | `fn program_3_3() { 1+2; 3-4; }` |
| program_3_4 | 3.4 multiplication/division | Pass | `fn program_3_4() { 1*2; 3/4; }` |
| program_3_5__1 | 3.5 no-arg call | Pass | `fn program_3_3__1__a() {} fn program_3_3__1__b() { program_3_3__1__a(); }` |
| program_3_5__2 | 3.5 call with expression arg | Pass | `fn program_3_3__2__a(mut a:i32) {} fn program_3_3__2__b() { program_3_3__2__a(1+2); }` |
| program_3_5__3_bad_count | 3.5 wrong arg count | Error | `fn program_3_3__3__a() {} fn program_3_3__3__b() { program_3_3__3__a(1); }` |
| program_3_5__4_bad_type | 3.5 wrong arg type | Error | `fn program_3_3__4__a(mut a:i32) {} fn program_3_3__4__b() { program_3_3__4__a(program_3_3__4__a); }` |
| program_3_5__5_void_rhs | 3.5 void function as RHS | Error | `fn program_3_3__5__a() {} fn program_3_3__5__b() { let mut a=program_3_3__5__a(); }` |
| program_4_1 | 4.1 if statement | Pass | `fn program_4_1(mut a:i32) -> i32 { if a>0 { return 1; } return 0; }` |
| program_4_2 | 4.2 else statement | Pass | `fn program_4_2(mut a:i32) -> i32 { if a>0 { return 1; } else { return 0; } }` |
| program_4_3 | 4.3 else-if statement | Pass | `fn program_4_3(mut a:i32) -> i32 { if a>0 { return a+1; } else if a<0 { return a-1; } else { return 0; } }` |
| program_5_1 | 5.1 while loop | Pass | `fn program_5_1(mut n:i32) { while n>0 { n=n-1; } }` |
| program_5_2__1 | 5.2 range for loop | Pass | `fn program_5_2__1(mut n:i32) { for mut i in 1..n+1 { n=n-1; } }` |
| program_5_2__2 | 5.2 non-integer range end | Error | `fn program_5_2__2(mut n:i32) { for mut i in 1..n+0.1 { n=n-1; } }` |
| program_5_3 | 5.3 loop statement | Pass | `fn program_5_3() { loop { } }` |
| program_5_4__1 | 5.4 break in loop | Pass | `fn program_5_4__1() { while 1==1 { break; } }` |
| program_5_4__2 | 5.4 break outside loop | Error | `fn program_5_4__2() { break; }` |
| program_5_4__3 | 5.4 continue in loop | Pass | `fn program_5_4__3() { while 1==0 { continue; } }` |
| program_5_4__4 | 5.4 continue outside loop | Error | `fn program_5_4__4() { continue; }` |
| program_6_1__1 | 6.1 immutable declarations | Pass | `fn program_6_1__1() { let a:i32=1; let b=2; }` |
| program_6_1__2 | 6.1 assign immutable variable | Error | `fn program_6_1__2() { let c:i32=1; c=2; }` |
| program_6_2__1 | 6.2 immutable reference type | Pass | `fn program_6_2__1() { let a:i32=1; let b:&i32=&a; }` |
| program_6_2__2 | 6.2 multiple immutable refs | Pass | `fn program_6_2__2() { let mut a:i32=1; let b=&a; let c=&a; }` |
| program_6_3 | 6.3 mutable reference | Pass | `fn program_6_3() { let mut a:i32=1; let mut b:&mut i32=&mut a; }` |
| program_6_3__4 | 6.3 mutable ref conflicts | Error | `fn program_6_3__4() { let mut a:i32=1; let b=&a; let mut c=&mut a; }` |
| program_6_3__5 | 6.3 mutable ref from immutable | Error | `fn program_6_3__5() { let a:i32=1; let mut b=&mut a; }` |
| program_6_4__1 | 6.4 deref assignment | Pass | `fn program_6_4__1() { let mut a:i32=1; let mut b=&mut a; *b=2; }` |
| program_6_4__2 | 6.4 deref non-reference | Error | `fn program_6_4__2() { let mut a:i32=1; let mut b=*a; }` |
| program_6_4__3 | 6.4 assign through immutable ref | Error | `fn program_6_4__3() { let mut a:i32=1; let mut b=&a; *b=2; }` |
| program_7_1 | 7.1 block expression as RHS | Pass | `fn program_7_1(mut x:i32,mut y:i32) { let mut z={ let mut t=x*x+x; t=t+x*y; t }; }` |
| program_7_2 | 7.2 function body tail expression | Pass | `fn program_7_2(mut x:i32,mut y:i32) -> i32 { let mut t=x*x+x; t=t+x*y; t }` |
| program_7_3 | 7.3 if expression | Pass | `fn program_7_3(mut a:i32) { let mut b=if a>0 { 1 } else { 0 }; }` |
| program_7_4__1 | 7.4 loop expression | Pass | `fn program_7_4__1() { let mut a=loop { break 1; }; }` |
| program_7_4__2 | 7.4 break expression outside loop | Error | `fn program_7_4__2() { break 2; }` |
| program_8_1 | 8.1 array type | Pass | `fn program_8_1() { let mut a:[i32;3]; let mut b:[[i32;3];3]; }` |
| program_8_2__1 | 8.2 array length mismatch | Error | `fn program_8_2__1(mut a:i32) { let mut a:[i32;2]; a=[1,2,3]; }` |
| program_8_2__2 | 8.2 array element type mismatch | Error | `fn program_8_2__2() { let mut a:[[i32;1];1]; a=[1]; }` |
| program_8_3__1 | 8.3 nested array access | Pass | `fn program_8_3__1(mut a:[[i32;3];3]) { let mut b:i32=a[0][0]; }` |
| program_8_3__2 | 8.3 array elements in expression | Pass | `fn program_8_3__2(mut a:[i32;3]) { let mut b:i32=a[0]+a[1]+a[2]; }` |
| program_8_3__3 | 8.3 array element assignment | Pass | `fn program_8_3__3(mut a:[i32;3]) { a[0]=1; }` |
| program_8_3__4_bad_index_type | 8.3 non-integer array index | Error | `fn program_8_3__4(mut a:i32) { let mut a=[1,2,3]; let mut b=a[a]; }` |
| program_8_3__5_bad_index_range | 8.3 array index out of range | Error | `fn program_8_3__5() { let mut a=[1,2,3]; let mut b=a[3]; }` |
| program_8_3__6_immutable_elem | 8.3 immutable array element | Error | `fn program_8_3__6() { let a:[i32;3]=[1,2,3]; a[0]=4; }` |
| program_9_1 | 9.1 tuple type | Pass | `fn program_9_1() { let a:(); let b:(i32;i32;); let a:(();i32); }` |
| program_9_2__1 | 9.2 tuple length mismatch | Error | `fn program_9_2__1(mut a:i32) { let mut a:(i32,i32); a=(1,2,3); }` |
| program_9_2__2 | 9.2 tuple element type mismatch | Error | `fn program_9_2__2() { let mut a:((),); a=(1,); }` |
| program_9_3__1 | 9.3 nested tuple access | Pass | `fn program_9_3__1(mut a:((i32,i32),)) { let mut b:i32=a.0.0; }` |
| program_9_3__2 | 9.3 tuple elements in expression | Pass | `fn program_9_3__2(mut a:(i32,i32,i32)) { let mut b:i32=a.0+a.1+a.2; }` |
| program_9_3__3 | 9.3 tuple element assignment | Pass | `fn program_9_3__3(mut a:(i32,i32,i32)) { a.0=1; }` |
| program_9_3__4_bad_index_type | 9.3 non-integer tuple index | Error | `fn program_9_3__4(mut a:i32) { let mut a=(1,2,3); let mut b=a.a; }` |
| program_9_3__5_bad_index_range | 9.3 tuple index out of range | Error | `fn program_9_3__5() { let mut a=(1,2,3); let mut b=a.3; }` |
| program_9_3__6_immutable_elem | 9.3 immutable tuple element | Error | `fn program_9_3__6() { let a:(i32,i32,i32)=(1,2,3); a.0=4; }` |

Additional regression cases used after fixing the PPT matrix:

| ID | Purpose | Expected | Sample |
| --- | --- | --- | --- |
| tail_if_function | `if` expression as function tail expression | Pass | `fn f(mut a:i32)->i32 { if a>0 { 1 } else { 0 } }` |
| tail_if_block_expr | `if` expression as block tail expression | Pass | `fn f(mut a:i32) { let mut b={ if a>0 { 1 } else { 0 } }; }` |
| tail_loop_block_expr | `loop` expression as block tail expression | Pass | `fn f() { let mut b={ loop { break 1; } }; }` |
| if_statement_no_else | ordinary `if` statement still parses as statement | Pass | `fn f(mut a:i32) { if a>0 { a=1; } }` |
| for_continue_ir | range-for `continue` jumps to increment step | Pass | `fn f(mut n:i32) { for mut i in 0..n { continue; } }` |
| for_array_break_ir | array for-in `break` emits loop exit jump | Pass | `fn f(mut a:[i32;3]) { for mut x in a { break; } }` |
| for_array_continue_ir | array for-in `continue` emits continue jump | Pass | `fn f(mut a:[i32;3]) { for mut x in a { continue; } }` |
