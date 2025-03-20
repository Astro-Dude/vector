const nsetQuestions = [
  {
    id: "q1",
    questionText: `A factory produces light bulbs, and the probability of a bulb being defective is 0.2. A quality control inspector randomly selects 5 bulbs for testing.
    If the factory incurs a cost of Rs 200 for each defective bulb found and a penalty of Rs 1000 if the number of defective bulbs exceeds the expected value by more than 2, what is the expected cost incurred by the factory?\n\n**Note: Put only the integral part of the answer without any padded zeroes or decimal points. If the answer is 5.79 the write only 5.**`,
    type: "text",
    correctAnswer: "206",
    explanation: `Let X be the number of defective bulbs in the sample of 5 bulbs.
  Since each bulb is defective with probability 0.2, X follows a Binomial distribution:
  X ~ Binomial(5, 0.2).

  Step 1: Compute the expected number of defective bulbs
  E(X) = n * p = 5 * 0.2 = 1.

  Step 2: Find the probability of each defective count
  Using the binomial probability formula:
  P(X = k) = C(n, k) * (p^k) * ((1-p)^(n-k))

  Compute relevant probabilities:
  P(X = 0) = C(5,0) * (0.2^0) * (0.8^5) = 1 * 1 * 0.32768 = 0.3277.
  P(X = 1) = C(5,1) * (0.2^1) * (0.8^4) = 5 * 0.2 * 0.4096 = 0.4096.
  P(X = 2) = C(5,2) * (0.2^2) * (0.8^3) = 10 * 0.04 * 0.512 = 0.2048.
  P(X = 3) = C(5,3) * (0.2^3) * (0.8^2) = 10 * 0.008 * 0.64 = 0.0512.
  P(X = 4) = C(5,4) * (0.2^4) * (0.8^1) = 5 * 0.0016 * 0.8 = 0.0064.
  P(X = 5) = C(5,5) * (0.2^5) * (0.8^0) = 1 * 0.00032 * 1 = 0.0003.

  Step 3: Compute the expected cost
  - If X ≤ 3: The cost is 200 * X.
  - If X > 3 (i.e., X = 4 or 5), an additional penalty of Rs 1000 is applied.

  Expected cost:
  E(Cost) = (200 * 0) * P(X=0) + (200 * 1) * P(X=1) + (200 * 2) * P(X=2) 
          + (200 * 3) * P(X=3) + (200 * 4 + 1000) * P(X=4) + (200 * 5 + 1000) * P(X=5).

  Substituting probabilities:
  E(Cost) = (0 * 0.3277) + (200 * 0.4096) + (400 * 0.2048) 
          + (600 * 0.0512) + (1800 * 0.0064) + (2000 * 0.0003).

  E(Cost) = 0 + 81.92 + 81.92 + 30.72 + 11.52 + 0.64.

  Final Answer: 206.72 => Rs 206 (only the integral part).`
  },
  
];

export default nsetQuestions; 