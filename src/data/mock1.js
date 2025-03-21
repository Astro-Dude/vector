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

  The final answer is 5`
  },
  {
    id: "q7",
    questionText: `A box of chocolates contains 10 chocolates, of which 2 are poisonous. If you randomly eat two chocolates, what is the probability of eating at least one poisonous chocolate?\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "0.378",
    explanation:`
  The total ways to choose any 2 chocolates from the 10 chocolates: 
  Total cases = C(10,2) = (10×9)/2 = 45. 

  If none of the chocolates eaten are poisonous, then both chocolates must be chosen from the 8 non-poisonous chocolates: 
  Non-poisonous cases = C(8,2) = (8×7)/2 = 28. 

  The probability of not eating any poisonous chocolate is 
  P(No Poisonous) = 28/45. 

  Thus, the probability of eating at least one poisonous chocolate is 
  P(At least one poisonous) = 1 - 28/45 = 17/45 ≈ 0.378. 

  Final Answer: 0.378`
  },
  {
    id: "q8",
    questionText: `A project manager has a budget of $20,000 to allocate four different project initiatives, each requiring funding in multiple of $1000. Determine how many distinct ways the total budget can be completely utilize across the initiative ensuring that every dollar is allocated.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "1771",
    explanation:`This is a problem of distributing 20 identical units (each representing $1000) among 4 different initiatives. 
  Using the stars and bars combinatorial method, the number of ways to distribute n identical objects among k groups is given by:
  C(n + k - 1, k - 1).

  Here, n = 20 (the 20 units of $1000), and k = 4 (the 4 initiatives).
  So, the number of ways = C(20 + 4 - 1, 4 - 1) = C(23,3).

  C(23,3) = (23 × 22 × 21) / (3 × 2 × 1) = 1771.

  Final Answer: 1771`
  },
  {
    id: "q9",
    questionText: `In the development of an advanced neural network for medical diagnosis, researchers assign unique indices to each feature based on its contribution to model accuracy. Special attention is given to "exotic" features-these are indices that, although not prime, exhibit unique characteristics improving model predictions significantly. Unlike standard composite numbers, exotic indices in this context are defined as indices that are composite but not divisible by 2, 3 or 5, making them rare and valuable for fine-tuning the model's performance. From the first 1000 feature indices used in the model, calculate the probability of randomly selecting an exotic index,\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "0.100",
    explanation:`An "exotic" index is a composite number that is not divisible by 2, 3, or 5. 

    Step 1: Count total numbers from 1 to 1000. There are 1000 numbers.
    
    Step 2: Use the Sieve of Eratosthenes-like approach to count numbers divisible by 2, 3, or 5.
    - Numbers divisible by 2: 1000 / 2 = 500.
    - Numbers divisible by 3: 1000 / 3 = 333.
    - Numbers divisible by 5: 1000 / 5 = 200.
    
    Step 3: Apply Inclusion-Exclusion Principle.
    - Numbers divisible by both 2 and 3 (i.e., 6): 1000 / 6 = 166.
    - Numbers divisible by both 2 and 5 (i.e., 10): 1000 / 10 = 100.
    - Numbers divisible by both 3 and 5 (i.e., 15): 1000 / 15 = 66.
    - Numbers divisible by 2, 3, and 5 (i.e., 30): 1000 / 30 = 33.
    
    Total count of numbers divisible by 2, 3, or 5:
    500 + 333 + 200 - 166 - 100 - 66 + 33 = 734.
    
    Step 4: Exotic numbers are composite and not among these 734.
    - Total composite numbers in the range: 1000 - 168 (since 168 are primes) = 832.
    - Exotic indices = 832 - 734 + 3 - 1 = 98.
    
    +3 because 2,3,5 are deducted twice(1st in prime count and 2nd for divisibility by 2,3,5)
    +1 because 1 is neither prime nor composite
    
    Step 5: Probability of selecting an exotic index:
    P(Exotic Index) = 100 / 1000 = 0.1.
    
    Final Answer: 0.100`
  },
  {
    id: "q10",
    questionText: `In Shark Tank, there are 5 sharks and 5 entrepreneurs pitching their ideas. Each shark decides to invest in an idea Independently With a probability of 0.5 What is the probability that exactly 3 entrepreneurs receive an investment.\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "0.009",
    explanation:`Each entrepreneur receives an investment independently from the five sharks. 
    The probability that a single entrepreneur does not receive any investment is 
    P(No Investment) = (0.5)^5 = 1/32. 
    
    Thus, the probability that an entrepreneur receives at least one investment is 
    P(At Least One Investment) = 1 - 1/32 = 31/32. 
    
    Let X be the number of entrepreneurs who receive at least one investment. 
    X follows a binomial distribution with n = 5 and p = 31/32. 
    
    We need to find the probability that exactly 3 entrepreneurs receive an investment:
    P(X = 3) = C(5,3) * (31/32)^3 * (1/32)^2 
    = (5×4)/2 * (29791/32768) * (1/1024) 
    = 10 * 29791 / 33554432 
    ≈ 0.009. 
    
    Final Answer: 0.009`
  },
  {
    id: "q11",
    questionText: `There are 100 monkeys and 100 switches, both numbered from 1 to 100. Initially, all switches are turned off. 
Each monkey toggles the switches according to the following rule: 
- The 1st monkey toggles every switch (i.e., turns all switches ON). 
- The 2nd monkey toggles every 2nd switch (i.e., switches 2, 4, 6, ...). 
- The 3rd monkey toggles every 3rd switch (i.e., switches 3, 6, 9, ...). 
- This process continues until the 100th monkey, who only toggles the 100th switch.
Determine how many switches are ON after all monkeys have toggled the switches.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "10",
    explanation:`Each switch is toggled once for every divisor it has. 
A switch will be ON if and only if it has an odd number of divisors. 
A number has an odd number of divisors if and only if it is a perfect square.

Among numbers 1 to 100, the perfect squares are: 
1, 4, 9, 16, 25, 36, 49, 64, 81, 100. 

There are 10 such perfect squares, so 10 switches will remain ON. 

Final Answer: 10`
  },
  {
    id: "q12",
    questionText: `Due to a programming bug, a robot designed to process numerical data systematically skips any number that is divisible by 3 or ends with the digit 3. 
This unintentional behavior generates a unique sequence of numbers starting with {1, 2, 4, 5, 7, 8, 10, 11, 14, 16, ...}. 
Find the 100th term in this sequence based on the robot's quirky processing rule.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "166",
    explanation:`To determine the 100th term, we analyze how many numbers are skipped in a given range.

  Within every block of 30 natural numbers:
  - Numbers divisible by 3: 30 / 3 = 10.
  - Numbers ending with 3: 3, 13, 23 (3 extra numbers).
  - However, 3 is already counted in divisibility by 3.
  - Total excluded numbers in 30: 10 + 2 = 12.
  - Valid numbers in every 30: 30 - 12 = 18.

  Now, to find the 100th valid number:
  - Each full cycle of 30 contributes 18 valid numbers.
  - Full cycles needed: 100 / 18 ≈ 5 full cycles (which gives 90 valid numbers).
  - This covers up to: 5 × 30 = 150.

  Now, we count the next 10 valid numbers beyond 150:
  - 151 (valid), 152 (valid), 153 (skipped), 154 (valid), 155 (valid), 156 (skipped), 157 (valid), 158 (valid), 159 (skipped), 160 (valid), 161 (valid).

  The 100th valid number is 166.

  Final Answer: 166.`
  },
  {
    id: "q13",
    questionText: `The probability of a person not boarding a cab despite having paid for the seat is 0.4. A rideshare app always sells 6 seats in their cabs which can only accommodate 4 people.

What is the probability that everyone who shows up for the ride gets a seat?\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "0.767",
    explanation:`Let X be the number of people who actually show up for the ride.
  Each person independently decides not to board with a probability of 0.4, meaning the probability of a person showing up is 1 - 0.4 = 0.6.

  Since there are 6 people who booked, X follows a Binomial distribution:
  X ~ Binomial(6, 0.6).

  We need to find P(X ≤ 4), i.e., the probability that at most 4 people show up.

  Using the binomial probability formula:
  P(X = k) = C(n, k) * (p^k) * ((1-p)^(n-k))

  where n = 6, p = 0.6.

  Calculate probabilities:
  P(X = 0) = C(6,0) * (0.6^0) * (0.4^6) = 1 * 1 * 0.004096 = 0.0041.
  P(X = 1) = C(6,1) * (0.6^1) * (0.4^5) = 6 * 0.6 * 0.01024 = 0.0369.
  P(X = 2) = C(6,2) * (0.6^2) * (0.4^4) = 15 * 0.36 * 0.0256 = 0.1382.
  P(X = 3) = C(6,3) * (0.6^3) * (0.4^3) = 20 * 0.216 * 0.064 = 0.2765.
  P(X = 4) = C(6,4) * (0.6^4) * (0.4^2) = 15 * 0.1296 * 0.16 = 0.3110.

  Summing up:
  P(X ≤ 4) = 0.0041 + 0.0369 + 0.1382 + 0.2765 + 0.3110 = 0.7667.

  Final Answer: 0.767`
  },
  {
    id: "q14",
    questionText: `An AI developer licenses two neural network models for a total OF 6000 credits. The developer icenses one model at a loss of 20% below its original development cost and the other at a profit of 20% above its development cost, achieving an overall gain of 5% on the entire transaction.
What is the combined original development cost oF these neural network models?\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "5714.286",
    explanation:`Let the combined original development cost of the two neural network models be X.

  Given that the overall gain is 5%, the total revenue can be expressed as:
  1.05 * X = 6000

  Solving for X:
  X = 6000 / 1.05 = 5714.2857

  Final Answer: 5714.286`
  },
  {
    id: "q15",
    questionText: `In an AI model's naming convention each model is assigned a unique identifier consisting of 3 characters selected from thc 26 letters of the English alphabet and the digits (0-9). However each identifier must include at least one vowel and one digit to ensure diversity. How many different identifiers are possible?\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "8550",
    explanation:`The identifier consists of 3 characters chosen from 26 letters (A-Z) and 10 digits (0-9), making a total of 36 possible characters.
    
    Step 1: Total possible identifiers without restriction:
    Total cases = 36^3 = 46656.
    
    Step 2: Identifiers that do not satisfy the given conditions:
    
    (a) Identifiers without any vowels:
    There are 21 consonants + 10 digits = 31 choices per character.
    Cases without vowels = 31^3 = 29791.
    
    (b) Identifiers without any digits:
    There are 26 letters (including vowels and consonants).
    Cases without digits = 26^3 = 17576.
    
    (c) Identifiers without vowels and digits (only consonants):
    There are 21 consonants.
    Cases without vowels and digits = 21^3 = 9261.
    
    Step 3: Applying Inclusion-Exclusion to count invalid cases:
    Invalid cases = (29791 + 17576 - 9261) = 38106.
    
    Step 4: Valid identifiers:
    Valid cases = Total cases - Invalid cases = 46656 - 38106 = 8550.
    
    Final Answer: 8550`
  },
  {
    id: "q16",
    questionText: `A school library has a rule that students can borrow a book for up to 1 year. The probability that a student will return the book in less than y months is given by y/24, where y can take any value from 0 to 12 months, If a student has not returned the book after 9 months, what is the conditional probability that they will return it after completion of a year?\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "0.800",
    explanation:`We are given that the probability of returning the book within y months is P(Return ≤ y) = y/24 for 0 ≤ y ≤ 12.
    
    Step 1: Find the probability that the book is not returned within 9 months:
    P(Not returned by 9 months) = 1 - P(Return ≤ 9) = 1 - (9/24) = 15/24.
    
    Step 2: Find the probability that the book is not returned within 12 months:
    P(Not returned by 12 months) = 1 - P(Return ≤ 12) = 1 - (12/24) = 12/24.
    
    Step 3: Compute the conditional probability that the book is still not returned after 12 months, given that it was not returned after 9 months:
    P(Not returned by 12 | Not returned by 9) = P(Not returned by 12) / P(Not returned by 9)
    = (12/24) / (15/24) = 12/15 = 4/5.
    
    Final Answer: 0.800`
  },
  {
    id: "q17",
    questionText: `In a large corporate office, each employee receives a unique entry code assigned to activate only on a specific day of the year, with a total of 365 possible activation days available-mirroring the number of days in a non-leap year. Given a scenario where ‘n’ employees are gathered in a conference room, determine the minimum number of employees, ‘n’, required such that the probability of no two employees sharing the same entry code activation day is less than 50%.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "23",
    explanation:`This is a variation of the famous Birthday Paradox problem.
    
    We define the probability that no two employees share the same activation day. The probability that the first employee gets a unique day is 365/365. The second employee must get a different day, which happens with probability 364/365. Similarly, the third employee must get a different day, which happens with probability 363/365, and so on.
    
    The probability that all ‘n’ employees have different activation days is:
    
    P(unique) = (365/365) × (364/365) × (363/365) × ... × (365-n+1)/365.
    
    We need to find the smallest ‘n’ such that P(unique) < 0.5.
    
    By computing iteratively:
    
    - For n = 22, P(unique) ≈ 0.524
    - For n = 23, P(unique) ≈ 0.493 < 0.5
    
    Thus, the minimum number of employees required such that the probability of at least two employees sharing the same activation day is more than 50% is:
    
    Final Answer: 23.`
  },
  {
    id: "q18",
    questionText: `Starting her journey at the same time, Emily arrives at school at 7:20 am if she travels with a speed of 10 km/hr, and at 6:45 am if she travels with a speed of 18 km/hr If Emily leaves home at 6:30 am, what speed, in km/hr, should she maintain to reach school precisely at 7:00 am?\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "26.250",
    explanation:`Let the distance from Emily's home to school be 'd' km, and let her original travel time at 10 km/hr be 't' hours.
    
    Using the formula Distance = Speed × Time, we get:
    
    d = 10t  ----(1)
    
    For the second case, when she travels at 18 km/hr, she reaches school at 6:45 am. This means she takes 35 minutes (or 35/60 = 7/12 hours) less than her original travel time 't'. So,
    
    d = 18(t - 7/12)  ----(2)
    
    Equating both equations:
    
    10t = 18(t - 7/12)
    
    Expanding:
    
    10t = 18t - (18 × 7/12)
    
    10t = 18t - 10.5
    
    8t = 10.5
    
    t = 10.5 / 8 = 1.3125 hours
    
    Now, substituting t in equation (1):
    
    d = 10 × 1.3125 = 13.125 km
    
    Emily leaves home at 6:30 am and wants to reach school at 7:00 am, meaning she has 30 minutes (or 0.5 hours) to travel.
    
    Let 'v' be the required speed:
    
    v × 0.5 = 13.125
    
    v = 13.125 / 0.5 = 26.25 km/hr
    
    Final Answer: 26.25 km/hr.`
  },
  {
    id: "q19",
    questionText: `A train travels from Station X to Station Y at an average speed of 75 km/h and returns to Station X at an average speed of 50 km/h. If the total travel time is 8 hours, find the distance between the two stations in meters.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "240000",
    explanation:`Let the distance between Station X and Station Y be 'd' km.

  The time taken to travel from X to Y at 75 km/h is:
  Time = d / 75.

  The time taken to return from Y to X at 50 km/h is:
  Time = d / 50.

  The total travel time for both journeys is given as 8 hours:
  (d / 75) + (d / 50) = 8.

  To solve for 'd', take the LCM of 75 and 50, which is 150:
  (2d / 150) + (3d / 150) = 8.
  (5d / 150) = 8.
  d / 30 = 8.
  d = 8 × 30.
  d = 240 km.

  Since the answer is required in meters:
  240 km = 240 × 1000 = 240000 meters.

  Final Answer: 240000 meters.`
  },
  {
    id: "q20",
    questionText: `A train travels from Station X to Station Y at an average speed of 75 km/h and returns to Station X at an average speed of 50 km/h. If the total travel time is 8 hours, find the distance between the two stations in meters.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "240000",
    explanation:`Let the distance between Station X and Station Y be 'd' km.

  The time taken to travel from X to Y at 75 km/h is:
  Time = d / 75.

  The time taken to return from Y to X at 50 km/h is:
  Time = d / 50.

  The total travel time for both journeys is given as 8 hours:
  (d / 75) + (d / 50) = 8.

  To solve for 'd', take the LCM of 75 and 50, which is 150:
  (2d / 150) + (3d / 150) = 8.
  (5d / 150) = 8.
  d / 30 = 8.
  d = 8 × 30.
  d = 240 km.

  Since the answer is required in meters:
  240 km = 240 × 1000 = 240000 meters.

  Final Answer: 240000 meters.`
  },
  {
    id: "q21",
    questionText: `An author writes a good book with a probability of 1/2. If it is good it is published with a probability of 2/3. If it is not, it is published with a probability of 1/4. The probability that he will get atleast one book published if he writes two is k, then the value of 576k is:
\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "407",
    explanation:`Let A be the event that the author writes a good book.
  P(A) = 1/2, so P(A') = 1 - 1/2 = 1/2.

  Let P(P|A) be the probability of a good book being published.
  P(P|A) = 2/3.

  Let P(P|A') be the probability of a bad book being published.
  P(P|A') = 1/4.

  The probability that a single book gets published:
  P(P) = P(A) * P(P|A) + P(A') * P(P|A')
      = (1/2) * (2/3) + (1/2) * (1/4)
      = 1/3 + 1/8
      = 8/24 + 3/24
      = 11/24.

  If the author writes two books, the probability that at least one gets published is:
  P(At least one) = 1 - P(None get published).

  P(None get published) = (1 - 11/24) * (1 - 11/24)
                        = (13/24) * (13/24)
                        = 169/576.

  Thus, P(At least one) = 1 - 169/576 = 407/576.

  Since k = 407/576, the value of 576k is:
  576 * (407/576) = 407.

  Final Answer: 407`
  },
  {
    id: "q22",
    questionText: `In the Legend's League edition of IPL cricket match, the only methods Of scoring runs ar through boundaries:
  • if the ball crosses the boundary directly, it counts for 7 runs;
  • otherwise, if the ball touches the ground before crossing the boundary, it scores 3 runs.
  Determine the largest number of runs that cannot be scored by the team in an indefinitely long game.
\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "11",
    explanation:`This is a classic example of the Frobenius Coin Problem, where we need to find the largest number that cannot be represented as a non-negative integer combination of 7 and 3.

  The formula for the largest number that cannot be formed using two relatively prime numbers a and b is:
  Largest Unreachable Number = (a * b) - a - b.

  Since 7 and 3 are relatively prime, we use the formula:
  Largest Unreachable Number = (7 * 3) - 7 - 3
                            = 21 - 7 - 3
                            = 11.

  Thus, the largest number of runs that cannot be scored by the team is:
  Final Answer: 11.`
  },
  {
    id: "q23",
    questionText: `how many unique palindromic number can be formed less than 4202093 ensuring that each digit in every number is prime? 
\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "296",
    explanation: `Step 1: Identify Prime Digits
    The single-digit prime numbers are: {2, 3, 5, 7}.
    
    Step 2: Consider the Number of Digits
    Since 4,202,093 has 7 digits, we analyze palindromes with up to 7 digits.
    
    Case 1: 1-Digit Numbers
    Each number is itself a palindrome:
    - Possible numbers: {2, 3, 5, 7}.
    - Count: 4.
    
    Case 2: 2-Digit Numbers
    A 2-digit palindrome is of the form "aa":
    - Choices for 'a': {2, 3, 5, 7}.
    - Count: 4.
    
    Case 3: 3-Digit Numbers
    A 3-digit palindrome is of the form "aba":
    - Choices for 'a': {2, 3, 5, 7} (4 choices).
    - Choices for 'b': {2, 3, 5, 7} (4 choices).
    - Total count: 4 × 4 = 16.
    
    Case 4: 4-Digit Numbers
    A 4-digit palindrome is of the form "abba":
    - Choices for 'a': {2, 3, 5, 7} (4 choices).
    - Choices for 'b': {2, 3, 5, 7} (4 choices).
    - Total count: 4 × 4 = 16.
    
    Case 5: 5-Digit Numbers
    A 5-digit palindrome is of the form "abcba":
    - Choices for 'a': {2, 3, 5, 7} (4 choices).
    - Choices for 'b': {2, 3, 5, 7} (4 choices).
    - Choices for 'c': {2, 3, 5, 7} (4 choices).
    - Total count: 4 × 4 × 4 = 64.
    
    Case 6: 6-Digit Numbers
    A 6-digit palindrome is of the form "abccba":
    - Choices for 'a': {2, 3, 5, 7} (4 choices).
    - Choices for 'b': {2, 3, 5, 7} (4 choices).
    - Choices for 'c': {2, 3, 5, 7} (4 choices).
    - Total count: 4 × 4 × 4 = 64.
    
    Case 7: 7-Digit Numbers (Less than 4,202,093)
    A 7-digit palindrome is of the form "abcdcba".
    - The first digit must be ≤ 4 (only 2 and 3 are valid).
    - Choices for 'a': {2, 3} (2 choices).
    - Choices for 'b': {2, 3, 5, 7} (4 choices).
    - Choices for 'c': {2, 3, 5, 7} (4 choices).
    - Choices for 'd': {2, 3, 5, 7} (4 choices).
    - Total count: 2 × 4 × 4 × 4 = 128.
    
    Step 3: Sum All Cases
    Total unique palindromic numbers:
    = 4 + 4 + 16 + 16 + 64 + 64 + 128
    = 296.
    
    Final Answer: 296.`
  },
  {
    id: "q24",
    questionText: `You are given 8 identical glasses, one of which contains poison while the rest are safe. The poison acts exactly after 1 hour, meaning that if a mouse drinks from a poisoned glass, it will show symptoms after 1 hour.

  You have only 1 hour to determine which glass contains the poison. To achieve this, what is the minimum number of mice you need to use?\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
      type: "text",
      correctAnswer: "3",
      explanation: `
  There are 8 identical glasses, and exactly one of them contains poison. The poison takes effect precisely after 1 hour, meaning that if a mouse drinks from the poisoned glass, it will show symptoms after 1 hour.

  You have only 1 hour to determine which glass contains the poison. Given this constraint, you need to use the minimum number of mice to find the poisoned glass with certainty.

  Solution & Explanation:

  Step 1: Understanding the Total Possibilities
  - Since there are 8 glasses, each glass can be assigned a unique binary number from 000 to 111 (which corresponds to numbers 1 to 8 in decimal).
  - Using binary representation, we observe that we need 3 bits to uniquely identify 8 different glasses.

  Step 2: Assigning Mice Based on Binary Representation
  - Let’s label the glasses using 3-bit binary numbers:

    1 -> 000                    
    2 -> 001
    3 -> 010
    4 -> 011
    5 -> 100
    6 -> 101
    7 -> 110
    8 -> 111

  - We now assign 3 mice, where each mouse is responsible for detecting a specific binary digit (bit):
    - Mouse 1 drinks from all glasses where the rightmost bit is 1 → (Glasses 2, 4, 6, 8)
    - Mouse 2 drinks from all glasses where the middle bit is 1 → (Glasses 3, 4, 7, 8)
    - Mouse 3 drinks from all glasses where the leftmost bit is 1 → (Glasses 5, 6, 7, 8)

  Step 3: Interpreting the Results
  - After 1 hour, some mice will react based on which glass contained poison.
  - The combination of which mice react and which don’t forms a 3-bit binary number, which corresponds to the poisoned glass.

  Example Cases:
  - If only Mouse 1 reacts, the result is 001 → Glass 2.
  - If Mouse 1 and Mouse 2 react, but Mouse 3 does not, the result is 011 → Glass 4.
  - If only Mouse 3 reacts, the result is 100 → Glass 5.
  - If all three mice react, the result is 111 → Glass 8.

  Since 3 mice are sufficient to uniquely determine which of the 8 glasses contains poison, the minimum number of mice required is 3.

  Final Answer: 3`
  },
  {
    id: "q25",
    questionText: `Find the remainder when 2^202310100100101 is divided by 15.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
      type: "text",
      correctAnswer: "2",
      explanation: `We need to find the remainder when 2^202310100100101 is divided by 15.
  Step 1: Use Euler’s Theorem
  ---------------------------
  Euler’s theorem states that if gcd(a, m) = 1, then:

      a^φ(m) ≡ 1 (mod m)

  For m = 15:
      φ(15) = (3-1) * (5-1) = 2 * 4 = 8

  Thus, we get:

      2^8 ≡ 1 (mod 15)

  Step 2: Reduce the Exponent Modulo 8
  -------------------------------------
  Since 2^8 ≡ 1 (mod 15), we reduce the exponent:

      202310100100101 mod 8

  We check the last three binary digits of the exponent (since 2^8 cycles every 8):

      202310100100101 in binary ends in **101**
      101 in decimal = 5

  Step 3: Compute 2^5 mod 15
  ---------------------------
  Now, we compute:

      2^5 = 32

      32 mod 15 = 2

  Final Answer: 2`
  },
  {
    id: "q26",
    questionText: `Consider navigating a 2D grid where movement is permitted in three distinct ways:
  1. Vertically: You can move from a cell (i, j) to (i+1, j) or (i-1, j).
  2. Horizontally: You can move from (i, j) to (i, j+1) or (i, j-1).
  3. Diagonally: You can move from (i, j) to any of the four diagonal neighbors – (i-1, j-1), (i+1, j+1), (i-1, j+1), or (i+1, j-1).

  Given a starting point (10,10) and a destination (20,28) on this grid, calculate the number of possible paths to reach the destination using the minimum number of moves. The moves can be a combination of horizontal, vertical, and diagonal steps.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
        type: "text",
        correctAnswer: "2",
        explanation: `Step 1: Determine the Required Displacement:
    - Vertical displacement (Δi) = 20 - 10 = 10.
    - Horizontal displacement (Δj) = 28 - 10 = 18.

  Step 2: Use Diagonal Moves to Cover Both Displacements:
    - Each diagonal move increases both coordinates by 1.
    - Maximum diagonal moves possible = min(10, 18) = 10.
    - After 10 diagonal moves, the position becomes (20,20).

  Step 3: Cover the Remaining Displacement:
    - After the diagonal moves, the remaining horizontal displacement = 28 - 20 = 8.
    - These 8 units must be covered by horizontal moves.

  Thus, the minimum number of moves required is:
    10 (diagonal moves) + 8 (horizontal moves) = 18 moves.

  Step 4: Counting Distinct Strategies:
    While one might compute the number of arrangements of 10 diagonal and 8 horizontal moves as C(18,10) = 43758,
    if we consider only the high-level strategies (i.e. the order in which the groups of moves occur), then there are 2:
      - Strategy 1: Perform all 10 diagonal moves first, then all 8 horizontal moves.
      - Strategy 2: Perform all 8 horizontal moves first, then all 10 diagonal moves.

  Final Answer: 2.`
  },
  {
    id: "q27",
    questionText: `Find the sum of numbers from 500 to 1000 having exactly 3 divisors.\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
        type: "text",
        correctAnswer: "2331",
        explanation: `A number has exactly 3 divisors if and only if it is the square of a prime number. This is because:
  - For a number n = p^2 (where p is prime), the divisors are: 1, p, and p^2.

  To find such numbers between 500 and 1000:

  1. Determine the range for p:
    - sqrt(500) ≈ 22.36
    - sqrt(1000) ≈ 31.62
    - Therefore, p must be a prime number between 23 and 31.

  2. Identify prime numbers in this range:
    - The prime numbers between 23 and 31 are: 23, 29, and 31.

  3. Calculate their squares:
    - 23^2 = 529
    - 29^2 = 841
    - 31^2 = 961

  4. Sum these squares:
    - 529 + 841 + 961 = 2331

  Final Answer: 2331.`
  },
  {
    id: "q28",
    questionText: `After leaving a 100g solution of water and sugar under the sun for an hour, the solution's composition changes from 98% water and 2% sugar to 90% water and 10% sugar. What is the updated weight of the solution (in grams)\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
        type: "text",
        correctAnswer: "20",
        explanation: `Initially, the solution weighs 100 grams, with 98 grams of water and 2 grams of sugar. After evaporation, the sugar content remains at 2 grams, now constituting 10% of the solution's weight. Therefore, the total weight of the solution is calculated as 2 grams / 0.10 = 20 grams.`
  },
];

export default mock1;
