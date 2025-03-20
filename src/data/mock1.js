const mock1 = [
  {
    id: "q1",
    questionText: "If the expression (n^3 - 1989)/n is a perfect square, determine the unique positive integer n.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**",
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
    `
  },
  {
    id: "q2",
    questionText: "How many natural numbers less than 3321 have all different digits?\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**",
    type: "text",
    correctAnswer: "1914",
    explanation:`
  To determine how many natural numbers less than 3321 have all different digits, we count valid numbers with unique digits.

  Step 1: Consider 1-digit, 2-digit, 3-digit, and 4-digit numbers  
    We'll count numbers with unique digits for each case.

    -> 1-digit numbers (1-9):
    There are 9 choices (1 to 9).

    -> 2-digit numbers (10-99):
    - First digit: 1 to 9 (9 choices)
    - Second digit: Any of 0-9 except the first digit (9 choices)
    Total: 9 × 9 = 81

    -> 3-digit numbers (100-999):
    - First digit: 1 to 9 (9 choices)
    - Second digit: Any of 0-9 except first digit (9 choices)
    - Third digit: Any of 0-9 except first two digits (8 choices)
    Total: 9 × 9 × 8 = 648

    -> 4-digit numbers (1000-3320):
    Since 3321 is the limit, we consider numbers from 1000 to 3320 with unique digits.

    -> Numbers starting with 1 or 2 (since 3xxx must be ≤ 3320):
    - First digit: 1 or 2 (2 choices)
    - Second digit: Any of 0-9 except first digit (9 choices)
    - Third digit: Any of 0-9 except first two digits (8 choices)
    - Fourth digit: Any of 0-9 except first three digits (7 choices)
    Total: 2 × 9 × 8 × 7 = 1008

    -> Numbers starting with 3:
    - If second digit is 0, 1, or 2 (since 34xx is too large), we calculate:
    - Second digit: 0, 1, or 2 (3 choices)
    - Third digit: Any of 0-9 except first two digits (8 choices)
    - Fourth digit: Any of 0-9 except first three digits (7 choices)
    Total: 3 × 8 × 7 = 168

  Step 2: Summing all valid cases
    Total = 9 + 81 + 648 + 1008 + 168 = 1914

    Thus, the total number of natural numbers less than 3321 with all different digits is:

    Answer: 1914.
  `
  },
  {
    id: "q3",
    questionText: "What is the power of 64 in 2000!\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**",
    type: "text",
    correctAnswer: "332",
    explanation:`
  To determine the power of 64 in 2000!, we first express 64 in terms of its prime factors:

  Step 1: Prime Factorization  
  64 = 2^6  
  Thus, finding the power of 64 in 2000! is equivalent to finding how many times 2^6 appears in 2000!.

  Step 2: Counting Factors of 2 in 2000!  
  Using Legendre's formula, the highest power of a prime p in n! is given by:  
      power of p in n! = ⌊n/p⌋ + ⌊n/p^2⌋ + ⌊n/p^3⌋ + ...  

  For p = 2 and n = 2000:  
      ⌊2000/2⌋ = 1000  
      ⌊2000/4⌋ = 500  
      ⌊2000/8⌋ = 250  
      ⌊2000/16⌋ = 125  
      ⌊2000/32⌋ = 62  
      ⌊2000/64⌋ = 31  
      ⌊2000/128⌋ = 15  
      ⌊2000/256⌋ = 7  
      ⌊2000/512⌋ = 3  
      ⌊2000/1024⌋ = 1  

  Total power of 2 in 2000!:  
      1000 + 500 + 250 + 125 + 62 + 31 + 15 + 7 + 3 + 1 = 1994  

  Step 3: Determining Power of 64 (which is 2^6)  
  To find the power of 64, divide the total power of 2 by 6:  
      1994 / 6 = 332 (integer division)  

  Thus, the highest power of 64 in 2000! is:  

  Answer: 332`
  },
  {
    id: "q4",
    questionText: `
    Consider a set S with 8 elements. If you randomly select a subset of S. what is the probability that the subset contains at least 4 elements?\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "0.637",
    explanation:`
  We are given a set S with 8 elements, and we randomly select a subset. We need to find the probability that the subset contains at least 4 elements.

  ### Step 1: Compute Total Subsets
  A set with n elements has **2^n** subsets, including the empty set.  
  For S with 8 elements:
  Total subsets = 2^8 = 256.

  ### Step 2: Compute Favorable Subsets (At Least 4 Elements)
  We sum subsets containing 4, 5, 6, 7, or 8 elements.

  - Subsets of size 4: C(8,4) = 70
  - Subsets of size 5: C(8,5) = 56
  - Subsets of size 6: C(8,6) = 28
  - Subsets of size 7: C(8,7) = 8
  - Subsets of size 8: C(8,8) = 1

  Total favorable subsets = 70 + 56 + 28 + 8 + 1 = 163.

  ### Step 3: Compute Probability
  Probability = Favorable Subsets / Total Subsets  
  = 163 / 256  
  ≈ 0.637 (rounded to 3 decimal places).

  Thus, the final answer is 0.637.`
  },
  {
    id: "q5",
    questionText: `Three integers are selected at random from the set {1, 2, 3,...., 21}.Given that the sum of selected numbers is even, what is the probability that all the numbers are even?\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "0.179",
    explanation:`
  We randomly select 3 integers from the set {1, 2, 3, ..., 21}, and we are given that their sum is even. We need to find the probability that all three selected numbers are even.

  Step 1: Understand the Even Sum Condition
  A sum is even if:
  1. All three numbers are even.
  2. Two numbers are odd and one number is even.

  Since we are given that the sum is even, we only consider these two cases.

  Step 2: Count Even and Odd Numbers
  The given set contains:
  - 10 even numbers: {2, 4, 6, ..., 20}
  - 11 odd numbers: {1, 3, 5, ..., 21}

  Step 3: Compute Favorable Cases (All Even)
  Ways to choose 3 even numbers from 10:
  C(10,3) = (10 × 9 × 8) / (3 × 2 × 1) = 120.

  Step 4: Compute Cases for (2 Odd, 1 Even)
  Ways to choose 2 odd numbers from 11:
  C(11,2) = (11 × 10) / (2 × 1) = 55.

  Ways to choose 1 even number from 10:
  C(10,1) = 10.

  Total ways for this case = 55 × 10 = 550

  Step 5: Compute Total Even Sum Cases
  Total ways to get an even sum = Favorable (all even) + Favorable (2 odd, 1 even)  
  = 120 + 550 = 670.

  Step 6: Compute Probability
  Probability = Favorable Cases (All Even) / Total Even Sum Cases  
  = 120 / 670  
  ≈ 0.179 (rounded to 3 decimal places).

  Thus, the final answer is 0.179 `
  },
  {
    id: "q6",
    questionText: `If lcm(a, b) = p^10 where p is a prime number, what is the count of distinct values possible for lcm(a^2, b^3)?\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "5",
    explanation:`
  Given that the least common multiple (LCM) of two numbers a and b is p^10 where p is a prime number, we need to determine the count of distinct values possible for lcm(a^2, b^3).

  Since a and b must be powers of p, we denote a = p^m and b = p^n where m and n are non-negative integers. The condition lcm(a, b) = p^10 implies that max(m, n) = 10. Therefore, at least one of m or n must be 10.

  We need to find the distinct values of lcm(a^2, b^3) = p^max(2m, 3n). We consider two cases:

  Case 1: m = 10 and n ≤ 10

  - For n from 0 to 6, max(2 * 10, 3n) = 20.
  - For n = 7, max(20, 21) = 21.
  - For n = 8, max(20, 24) = 24.
  - For n = 9, max(20, 27) = 27.
  - For n = 10, max(20, 30) = 30.

  This gives the exponents: 20, 21, 24, 27, 30.

  Case 2: n = 10 and m ≤ 10

  - For any m from 0 to 10, max(2m, 3 * 10) = 30.

  This gives the exponent: 30, which is already included in Case 1.

  Combining the results from both cases, the distinct exponents are 20, 21, 24, 27, and 30. Therefore, there are 5 distinct values possible for lcm(a^2, b^3).

  The final answer is 5.`
  }
];

export default mock1;
