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
  {
    id: "q2",
    questionText: `A committee of three persons is to be randomly selected from a group of three men and two women and the chairperson will be randomly selected from the committee. The probability that the committee will have exactly two women and one man, and that the chairperson will be a woman, is/are
\n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "0.200",
    explanation:`Step 1: Calculate the total number of possible committees.
  Total ways to select 3 people from 5 people = C(5,3) = 10
  Step 2: Calculate the number of ways to have exactly 2 women and 1 man.
  Ways to select 2 women from 2 women = C(2,2) = 1
  Ways to select 1 man from 3 men = C(3,1) = 3
  Total favorable committees = 1 × 3 = 3
  Step 3: Calculate the probability of having 2 women and 1 man.
  P(2 women, 1 man) = 3/10
  Step 4: Calculate the probability that the chairperson is a woman, given this committee.
  Since the chairperson is randomly selected from the committee of 3 people, and there are 2 women in the committee:
  P(chairperson is a woman | 2 women, 1 man) = 2/3
  Step 5: Calculate the joint probability.
  P(2 women, 1 man AND chairperson is a woman) = P(2 women, 1 man) × P(chairperson is a woman | 2 women, 1 man)
  P(2 women, 1 man AND chairperson is a woman) = 3/10 × 2/3 = 6/30 = 1/5
  Therefore, the probability that the committee will have exactly two women and one man, and that the chairperson will be a woman, is 1/5.
  Final Answer: 0.200`
  },  
  {
    id: "q3",
    questionText: `An urn contains 10 balls coloured either black or red. When selecting two balls from the urn at random, the probability that a ball of each colour is selected is 8/15. Assuming that the urn contains more black balls than red balls, the probability that atleast one black hall is selected, when selecting two balls, is
    \n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "0.867",
    explanation:`The total number of balls is 10, so b + r = 10
    There are more black balls than red balls, so b > r
    The probability of selecting one ball of each color is 8/15
    
    Step 1: Find the values of b and r.
    When selecting 2 balls from 10 balls, the total number of possible outcomes is C(10,2) = 45.
    The number of ways to select one black ball and one red ball is b × r.
    Since the probability of selecting one ball of each color is 8/15:
    b × r / 45 = 8/15
    b × r = 8 × 45 / 15 = 24
    Combined with b + r = 10, we have:
    b + r = 10
    b × r = 24
    These are the equations for b and r. To solve:
    r = 10 - b
    b × (10 - b) = 24
    10b - b² = 24
    b² - 10b + 24 = 0
    Using the quadratic formula:
    b = (10 ± √(100 - 96))/2 = (10 ± 2)/2
    b = 6 or b = 4
    Since b > r and b + r = 10, we must have b = 6 and r = 4.
    Step 2: Calculate the probability of selecting at least one black ball.
    The probability of selecting at least one black ball = 1 - (probability of selecting no black balls)
    Probability of selecting no black balls = C(r,2) / C(10,2) = C(4,2) / 45 = 6 / 45 = 2/15
    Therefore, the probability of selecting at least one black ball = 1 - 2/15 = 13/15.
    The answer is 13/15
    Final Answer: 0.867`
  },  
  {
    id: "q4",
    questionText: `A company's profits increased by 15% this year, decreased by 10% next year, and increased by 12% in the third year. What is the net percentage change in profits over the three years?
    \n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
    type: "text",
    correctAnswer: "15.920",
    explanation:`Let the initial profit be 100 units.
    
    After a 15% increase in the first year:
    Profit = 100 × 1.15 = 115.
    
    After a 10% decrease in the second year:
    Profit = 115 × 0.90 = 103.5.
    
    After a 12% increase in the third year:
    Profit = 103.5 × 1.12 = 115.92.
    
    Net percentage change:
    ((115.92 - 100) / 100) × 100 = 15.92%.
    
    Final Answer: 15.920%.`
  },  
  {
    id: "q5",
    questionText: `A is one of the 6 horses entered for a race, and is to be ridden by one of two jockeys B or C. It is 2 to 1 that B rides A, in which case all the horses are equally likely to win; if C rides A, his chance is trebled. If the odds against his winnings is p/q (where p and q are coprime ), then the value of pq is\n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "65",
    explanation:`Let P(B) be the probability that B rides A.
    Given that the odds of B riding A are 2:1, the probability is:
    P(B) = 2/(2+1) = 2/3,
    P(C) = 1/3.
    
    Case 1: If B rides A, the probability of A winning (since all horses are equally likely) is:
    P(A wins | B rides) = 1/6.
    
    Case 2: If C rides A, his chances are trebled, meaning A's probability of winning is:
    P(A wins | C rides) = 3 * (1/6) = 1/2.
    
    Now, using the law of total probability:
    P(A wins) = P(A wins | B rides) * P(B) + P(A wins | C rides) * P(C)
    = (1/6 * 2/3) + (1/2 * 1/3)
    = (2/18) + (3/18)
    = 5/18.
    
    Thus, the odds against A winning are:
    (1 - 5/18) : 5/18
    = 13/18 : 5/18
    = 13:5.
    
    Here, p = 13 and q = 5, so pq = 13 * 5 = 65.
    
    Final Answer: 65`
  },
  {
    id: "q6",
    questionText: `A room has three electric lamps. From a collection of 10 electric bulbs of which 6 are good 3 are selected at random & put in the lamps. If the probability that the room is lighted x. Then the value of 90x is:
    \n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
    type: "text",
    correctAnswer: "87",
    explanation:`To light up the room, at least one of the selected bulbs must be good.
    
    Total ways to choose any 3 bulbs from the 10 available:
    Total cases = C(10,3) = (10×9×8) / (3×2×1) = 120.
    
    Now, calculate the number of ways to choose 3 defective bulbs (which would leave the room unlit):
    Ways to choose all defective bulbs = C(4,3) = (4×3×2) / (3×2×1) = 4.

    Thus, the probability that the room is NOT lighted is:
    P(All defective) = 4/120 = 1/30.
    
    Therefore, the probability that the room is lighted is:
    P(At least one good) = 1 - 1/30 = 29/30.
    
    Given that x = 29/30, we calculate 90x:
    90x = 90 × (29/30) = 87.
    
    Final Answer: 87.`
  },
  {
    id: "q7",
    questionText: `In a batch of 10 articles, 4 are defective, 6 are taken from the batch for inspection. if more than 2 articles in this batch are defective, the whole batch is rejected. Find the probability that the batch will be rejected.
    
  \n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
  type: "text",
  correctAnswer: "0.452",
  explanation:`The batch will be rejected if more than 2 defective articles are found in the 6 chosen for inspection.
  
  Total ways to choose any 6 articles from the 10 available:
  Total cases = C(10,6) = (10×9×8×7×6×5) / (6×5×4×3×2×1) = 210.
  
  Now, calculate the cases where more than 2 defective articles are chosen:
  - Choosing exactly 3 defective articles:
  Ways to choose 3 defective = C(4,3) = (4×3×2) / (3×2×1) = 4.
  Ways to choose 3 good articles = C(6,3) = (6×5×4) / (3×2×1) = 20.
  Total ways = 4 × 20 = 80.
  
  - Choosing exactly 4 defective articles:
  Ways to choose 4 defective = C(4,4) = 1.
  Ways to choose 2 good articles = C(6,2) = (6×5) / (2×1) = 15.
  Total ways = 1 × 15 = 15.
  
  Total ways to pick more than 2 defective = 80 + 15 = 95.
  
  Thus, the probability of batch rejection is:
  P(Reject) = 95 / 210 ≈ 0.452.
  
  Final Answer: 0.452`
},  
{
  id: "q8",
  questionText: `In a dataset of 200 Al algorithms. 120 are designed for image processing. 80 for natural languagc processing (NLP). and 50 arc capable of both image processing and NLP. If an algorithm is randomly selected from the dataset. what is the probability that it is not designed for either image processing or NLP?
  \n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
  type: "text",
  correctAnswer: "0.250",
  explanation:`We are given a dataset of 200 AI algorithms where:
  - 120 are designed for image processing.
  - 80 are designed for natural language processing (NLP).
  - 50 are capable of both image processing and NLP.
  
  Using the principle of inclusion-exclusion, the number of algorithms designed for either image processing or NLP is:
  
  Total (Image Processing ∪ NLP) = (Image Processing) + (NLP) - (Both)
  = 120 + 80 - 50
  = 150.
  
  The number of algorithms that are not designed for either image processing or NLP is:
  
  Total Algorithms - (Image Processing ∪ NLP) = 200 - 150 = 50.
  
  Thus, the probability of randomly selecting an algorithm that is not designed for either image processing or NLP is:
  
  P(Not Image Processing or NLP) = 50/200 = 1/4.
  
  Final Answer: 0.250`
},  
{
  id: "q9",
  questionText: `Let X = No. of 6-digit numbers divisible by either 10, 15 or 25. Let y = No. of 6-digit numbers divisible by 10, 15 and 25. What will be the value of X + Y?
  \n\n**Note: Put the answer as an integer without any padded zeroes or decimal points. For example, if the answer is 1, then please put 1 as the answer and not 1.0 or 01 or 001.**`,
  type: "text",
  correctAnswer: "138000",
  explanation:`We need to find the total number of 6-digit numbers divisible by either 10, 15, or 25 (denoted as X),
  and add it to the count of 6-digit numbers divisible by 10, 15, and 25 (denoted as Y).
  
  Step 1: Define the Range of 6-Digit Numbers
  -------------------------------------------
  A 6-digit number ranges from 100000 to 999999.
  
  Step 2: Find X = Numbers Divisible by 10, 15, or 25
  ---------------------------------------------------
  We use the Inclusion-Exclusion Principle:
  
  1. Numbers divisible by 10:
  - Ends in 0 → Sequence: 100000, 100010, ..., 999990 (AP with common difference 10)
  - Count = (999990 - 100000) / 10 + 1 = 90000
  
  2. Numbers divisible by 15:
  - Divisible by both 3 and 5 → Sequence: 100005, 100020, ..., 999990
  - Count = (999990 - 100005) / 15 + 1 = 60000
  
  3. Numbers divisible by 25:
  - Ends in 00, 25, 50, 75 → Sequence: 100000, 100025, ..., 999975
  - Count = (999975 - 100000) / 25 + 1 = 36000
  
  Now, apply Inclusion-Exclusion:
  
  4. Numbers divisible by both 10 and 15 (divisible by 30):
  - Sequence: 100020, 100050, ..., 999990
  - Count = (999990 - 100020) / 30 + 1 = 30000
  
  5. Numbers divisible by both 10 and 25 (divisible by 50):
  - Sequence: 100000, 100050, ..., 999950
  - Count = (999950 - 100000) / 50 + 1 = 18000
  
  6. Numbers divisible by both 15 and 25 (divisible by 75):
  - Sequence: 100050, 100125, ..., 999975
  - Count = (999975 - 100050) / 75 + 1 = 12000
  
  7. Numbers divisible by 10, 15, and 25 (divisible by 150):
  - Sequence: 100050, 100200, ..., 999900
  - Count = (999900 - 100050) / 150 + 1 = 6000
  
  Thus, using Inclusion-Exclusion:
  X = 90000 + 60000 + 36000 - 30000 - 18000 - 12000 + 6000 = 132000
  
  Step 3: Find Y = Numbers Divisible by 10, 15, and 25
  ----------------------------------------------------
  These numbers are already counted in X as those divisible by 150.
  Y = 6000
  
  Step 4: Compute (X + Y)
  -----------------------
  X + Y = 132000 + 6000 = 138000
  
  Final Answer: 138000`
},
{
  id: "q10",
  questionText: `An AI system is programmed to complete a diagnostic task within a one-hour time limit. The probability that the AI system will complete the task in less than ‘x’ hours is given by x/2 , where ‘x’ can take any value from 0 to 1 hour.
If, after 0.75 hours, the AI system is still processing the task, what is the conditional probability that it will use the entire hour to complete the task?
  \n\n**Note: Round off your answer to 3 decimal places. For example if the answer is 0.5 put 0.500 and if the answer is 0.5447 then put 0.545**`,
  type: "text",
  correctAnswer: "0.800",
  explanation:`We are given that the probability of the AI system completing the diagnostic task in less than 'x' hours is given by:

      P(T < x) = x / 2  for  0 ≤ x ≤ 1

  Step 1: Find the Probability that AI Completes by 0.75 Hours
  -----------------------------------------------------------
  We substitute x = 0.75 into the given probability function:

      P(T < 0.75) = 0.75 / 2 = 0.375

  Thus, the probability that the AI has not completed the task by 0.75 hours is:

      P(T ≥ 0.75) = 1 - P(T < 0.75) = 1 - 0.375 = 0.625

  Step 2: Find the Probability that AI Uses the Full Hour
  -------------------------------------------------------
  The probability that the AI completes the task in less than 1 hour:

      P(T < 1) = 1 / 2 = 0.5

  So, the probability that the AI does not complete the task in less than 1 hour (i.e., it uses the full hour) is:

      P(T ≥ 1) = 1 - P(T < 1) = 1 - 0.5 = 0.5

  Step 3: Compute the Conditional Probability
  -------------------------------------------
  We need to find:

      P(T = 1 | T ≥ 0.75) = P(T ≥ 1) / P(T ≥ 0.75)

  Substituting values:

      P(T = 1 | T ≥ 0.75) = 0.5 / 0.625 = 4 / 5 = 0.8

  Final Answer: 0.8`
},  
];

export default nsetQuestions; 