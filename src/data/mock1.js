const mock1 = [
  {
    id: "q1",
    questionText: "If the expression (n^3 - 1989)/n is a perfect square, determine the unique positive integer n.",
    type: "text",
    correctAnswer: "13",
    explanation:`
    Given the expression (n^3 - 1989)/n, we need to find the unique positive integer n such that the result is a perfect square.
    
    Step 1: Express the given condition
    (n^3 - 1989)/n = n^2 - (1989/n)
    Since the result must be a perfect square, (1989/n) must be an integer, meaning n must be a divisor of 1989.
    
    Step 2: Prime factorization of 1989
    1989 = 3^2 * 13 * 17
    Divisors of 1989 are: 1, 3, 9, 13, 17, 27, 39, 51, 117, 153, 221, 663, 1989.
    
    Step 3: Check for valid n
    We test divisors one by one.
    
    For n = 13:
    (n^3 - 1989)/n = (13^3 - 1989)/13 = (2197 - 1989)/13 = 208/13 = 16
    Since 16 is a perfect square (4^2), the valid n is:
    
    Answer: 13
    `,
  },
];

export default mock1;
