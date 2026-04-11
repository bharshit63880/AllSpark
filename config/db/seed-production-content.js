const targetDb = db.getSiblingDB("allSpark");

const seedAdminEmail =
  typeof process !== "undefined" && process.env ? process.env.SEED_ADMIN_EMAIL : null;
const seedAdminUsername =
  typeof process !== "undefined" && process.env ? process.env.SEED_ADMIN_USERNAME : null;

const adminUser =
  (seedAdminEmail && targetDb.users.findOne({ email: seedAdminEmail })) ||
  (seedAdminUsername && targetDb.users.findOne({ user_name: seedAdminUsername })) ||
  targetDb.users.findOne({ email: "admin@example.com" }) ||
  targetDb.users.findOne({ user_name: "admin" }) ||
  targetDb.users.findOne(
    { role: "ADMIN", activation_status: "active" },
    { sort: { createdAt: 1, _id: 1 } }
  );

if (!adminUser) {
  throw new Error(
    "admin user not found. Create/login an active admin first or set SEED_ADMIN_EMAIL / SEED_ADMIN_USERNAME."
  );
}

const adminId = String(adminUser._id);

const supportedLanguageIds = [63, 71, 62, 52, 54]; // C++, Java, Python, JavaScript, C#

const cloneCases = (cases) => cases.map((c) => ({ ...c }));

const makeMultiLangCases = (publicCases, privateCases) =>
  supportedLanguageIds.map((languageId) => ({
    language_id: languageId,
    public_test_cases: cloneCases(publicCases),
    private_test_cases: cloneCases(privateCases),
  }));

const makeCase = (
  id,
  stdin,
  expected_output,
  cpu_time_limit = 2,
  memory_limit = 128000,
  stack_limit = 128000
) => ({
  id: String(id),
  stdin: String(stdin),
  expected_output: String(expected_output),
  cpu_time_limit,
  memory_limit,
  stack_limit,
});

print("[Seed] Clearing existing contest/problem related data...");
targetDb.participants.deleteMany({});
targetDb.submissions.deleteMany({});
targetDb.contests.deleteMany({});
targetDb.problems.deleteMany({});

// ==================== EASY PROBLEMS (30) ====================

const problems = [
  // Easy 1-10
  {
    name: "Sum of Two Numbers",
    slug: "sum-of-two-numbers",
    tags: ["arithmetic", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
This is a beginner-friendly problem where you need to add two numbers together. You'll read two integers from input, calculate their sum, and print the result. It's perfect for practicing basic input/output operations and arithmetic in any programming language.

📥 INPUT FORMAT  
The input consists of a single line with two integers separated by a space. These represent the numbers you need to add.

📤 OUTPUT FORMAT  
Print a single integer that represents the sum of the two input numbers. Output only the number, no extra text or spaces.

🧠 WHAT YOU NEED TO DO  
1. Read the input line and extract the two integers
2. Add the two numbers together
3. Print the resulting sum

⚠️ EDGE CASES TO CONSIDER  
- Negative numbers (both can be negative, or one positive and one negative)
- Zero values (one or both numbers could be zero)
- Large numbers within the given constraints
- Equal numbers

⛔ COMMON MISTAKES  
- Forgetting to handle negative numbers correctly
- Adding extra spaces or text in output
- Not reading input properly (missing the space separator)
- Using wrong data types that can't handle the number range

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(1) - constant time since we only do one addition
Space Complexity: O(1) - constant space, just storing two variables

📌 EXAMPLES  
Sample Input 1: "5 3" means a=5, b=3, sum=8
Sample Input 2: "-2 7" means a=-2, b=7, sum=5 (negative plus positive)`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5 3", "8"),
        makeCase("2", "-2 7", "5"),
      ],
      [
        makeCase("11", "100 200", "300"),
        makeCase("12", "-50 30", "-20"),
        makeCase("13", "999999 1", "1000000"),
      ]
    ),
  },
  {
    name: "Product of Array Elements",
    slug: "product-of-array",
    tags: ["loops", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You have an array of numbers and need to multiply them all together to get their product. This problem helps you practice working with arrays, loops, and multiplication operations. It's great for understanding how to process multiple values stored in a collection.

📥 INPUT FORMAT  
First line: a single integer n (the number of elements)
Second line: n integers separated by spaces (the array elements)

📤 OUTPUT FORMAT  
Print a single integer representing the product of all array elements.

🧠 WHAT YOU NEED TO DO  
1. Read the number n
2. Read the next line containing n integers into an array
3. Initialize a product variable to 1
4. Loop through each element in the array
5. Multiply the current product by each element
6. Print the final product

⚠️ EDGE CASES TO CONSIDER  
- Array with only one element
- Array containing zeros (product becomes zero)
- Negative numbers (odd count makes product negative, even count makes positive)
- All positive numbers
- Mix of positive and negative numbers

⛔ COMMON MISTAKES  
- Forgetting to initialize product to 1 (would give wrong results)
- Not handling zero correctly (any zero makes entire product zero)
- Integer overflow with large products
- Reading input incorrectly (missing n or array elements)
- Using wrong loop bounds

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(n) - we visit each element once
Space Complexity: O(n) - storing the array, or O(1) if processing element by element

📌 EXAMPLES  
Sample Input 1: n=4, array=[2,3,4,5], product=2×3×4×5=120
Sample Input 2: n=3, array=[1,1,1], product=1×1×1=1`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "4\n2 3 4 5", "120"),
        makeCase("2", "3\n1 1 1", "1"),
      ],
      [
        makeCase("11", "5\n2 2 2 2 2", "32"),
        makeCase("12", "2\n-3 4", "-12"),
        makeCase("13", "1\n7", "7"),
      ]
    ),
  },
  {
    name: "Maximum of Two Numbers",
    slug: "max-of-two",
    tags: ["conditional", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
Given two numbers, you need to find which one is larger and print it. This simple comparison problem introduces you to conditional logic and decision-making in programming. It's fundamental for understanding how programs make choices based on input values.

📥 INPUT FORMAT  
A single line containing two integers separated by a space.

📤 OUTPUT FORMAT  
Print the larger of the two numbers. If they are equal, print either one.

🧠 WHAT YOU NEED TO DO  
1. Read the two integers from input
2. Compare which one is larger
3. Print the larger number

⚠️ EDGE CASES TO CONSIDER  
- Both numbers equal
- One positive, one negative
- Both negative numbers
- One or both are zero
- Maximum and minimum possible values

⛔ COMMON MISTAKES  
- Not handling the equal case properly
- Using wrong comparison operators
- Printing both numbers instead of just the larger one
- Forgetting to consider negative numbers
- Adding extra output or formatting

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(1) - constant time comparison
Space Complexity: O(1) - just storing two variables

📌 EXAMPLES  
Sample Input 1: "7 3" - 7 is larger than 3, so output 7
Sample Input 2: "5 5" - both equal, can output 5`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "7 3", "7"),
        makeCase("2", "5 5", "5"),
      ],
      [
        makeCase("11", "-10 -5", "-5"),
        makeCase("12", "0 100", "100"),
        makeCase("13", "-1000 999", "999"),
      ]
    ),
  },
  {
    name: "Count Vowels in String",
    slug: "count-vowels",
    tags: ["string", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You have a string of text and need to count how many vowels appear in it. Vowels are the letters A, E, I, O, U (both uppercase and lowercase). This problem helps you practice string processing and character checking, which are essential skills in programming.

📥 INPUT FORMAT  
A single line containing a string of characters.

📤 OUTPUT FORMAT  
Print a single integer representing the total number of vowels in the string.

🧠 WHAT YOU NEED TO DO  
1. Read the input string
2. Initialize a counter to zero
3. Loop through each character in the string
4. Check if the character is a vowel (a,e,i,o,u,A,E,I,O,U)
5. If it is a vowel, increment the counter
6. Print the final count

⚠️ EDGE CASES TO CONSIDER  
- Empty string (should return 0)
- String with no vowels
- String with only vowels
- Mixed case letters
- Strings with spaces and punctuation (ignore non-letter characters)
- Very long strings

⛔ COMMON MISTAKES  
- Forgetting to check both uppercase and lowercase vowels
- Counting spaces or punctuation as vowels
- Not initializing the counter properly
- Using wrong case sensitivity
- Off-by-one errors in loops

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(n) - we check each character once
Space Complexity: O(1) - constant extra space

📌 EXAMPLES  
Sample Input 1: "hello world" - vowels are e,o,o (3 total)
Sample Input 2: "aeiou" - all 5 letters are vowels`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "hello world", "3"),
        makeCase("2", "aeiou", "5"),
      ],
      [
        makeCase("11", "bcdfg", "0"),
        makeCase("12", "A E I O U", "5"),
        makeCase("13", "programming", "3"),
      ]
    ),
  },
  {
    name: "Reverse a Number",
    slug: "reverse-number",
    tags: ["math", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You need to take a number and reverse its digits to create a new number. For example, 123 becomes 321. This problem teaches you about number manipulation, string operations, and careful handling of special cases like negative numbers and trailing zeros.

📥 INPUT FORMAT  
A single line containing one integer.

📤 OUTPUT FORMAT  
Print the integer formed by reversing the digits of the input number.

🧠 WHAT YOU NEED TO DO  
1. Read the input number
2. Convert it to a string or process digit by digit
3. Reverse the order of the digits
4. Convert back to a number
5. Handle the sign (negative numbers stay negative)
6. Print the result

⚠️ EDGE CASES TO CONSIDER  
- Negative numbers (sign should stay at front)
- Numbers ending with zeros (reversed shouldn't have leading zeros)
- Zero itself (reversing 0 gives 0)
- Single digit numbers (no change)
- Numbers with leading zeros in the reversed result

⛔ COMMON MISTAKES  
- Forgetting to handle negative signs properly
- Including leading zeros in the output
- Not handling zero correctly
- Integer overflow with large numbers
- Wrong sign placement

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(d) where d is number of digits (typically small)
Space Complexity: O(d) for string conversion, or O(1) with math

📌 EXAMPLES  
Sample Input 1: 12345 - digits 1,2,3,4,5 reversed to 5,4,3,2,1 = 54321
Sample Input 2: 100 - digits 1,0,0 reversed to 0,0,1 but no leading zeros = 1`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "12345", "54321"),
        makeCase("2", "100", "1"),
      ],
      [
        makeCase("11", "999", "999"),
        makeCase("12", "-123", "-321"),
        makeCase("13", "0", "0"),
      ]
    ),
  },
  {
    name: "Check if Number is Even",
    slug: "is-even",
    tags: ["modulo", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You need to determine if a given number is even or odd and print the result. An even number is divisible by 2 with no remainder, while an odd number leaves a remainder of 1 when divided by 2. This problem introduces the modulo operator and basic conditional logic.

📥 INPUT FORMAT  
A single line containing one integer.

📤 OUTPUT FORMAT  
Print "even" if the number is even, "odd" if the number is odd. Use lowercase letters only.

🧠 WHAT YOU NEED TO DO  
1. Read the input number
2. Check if the number modulo 2 equals 0
3. If yes, print "even"
4. If no, print "odd"

⚠️ EDGE CASES TO CONSIDER  
- Zero (0 is even)
- Negative numbers (negative evens are still even)
- Large numbers within constraints
- One and negative one

⛔ COMMON MISTAKES  
- Forgetting that 0 is even
- Not handling negative numbers correctly
- Using wrong modulo syntax
- Printing uppercase or mixed case
- Adding extra spaces or punctuation

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(1) - constant time operation
Space Complexity: O(1) - just storing one variable

📌 EXAMPLES  
Sample Input 1: 4 - 4 ÷ 2 = 2 with remainder 0, so even
Sample Input 2: 7 - 7 ÷ 2 = 3 with remainder 1, so odd`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "4", "even"),
        makeCase("2", "7", "odd"),
      ],
      [
        makeCase("11", "0", "even"),
        makeCase("12", "-3", "odd"),
        makeCase("13", "1000000", "even"),
      ]
    ),
  },
  {
    name: "Factorial of a Number",
    slug: "factorial",
    tags: ["recursion", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You need to calculate the factorial of a given number. The factorial of n (written as n!) is the product of all positive integers from 1 to n. For example, 5! = 5 × 4 × 3 × 2 × 1 = 120. This problem introduces multiplication loops and handling special cases like 0! = 1.

📥 INPUT FORMAT  
A single line containing a non-negative integer n.

📤 OUTPUT FORMAT  
Print the factorial of n as a single integer.

🧠 WHAT YOU NEED TO DO  
1. Read the input number n
2. If n is 0, the result is 1
3. Otherwise, initialize result to 1
4. Multiply result by each number from 1 to n
5. Print the final result

⚠️ EDGE CASES TO CONSIDER  
- n = 0 (factorial is 1)
- n = 1 (factorial is 1)
- Maximum n within constraints
- Very small factorials

⛔ COMMON MISTAKES  
- Forgetting that 0! = 1
- Starting multiplication from 0 instead of 1
- Integer overflow with large results
- Using wrong loop bounds
- Not handling the base case properly

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(n) - n multiplications
Space Complexity: O(1) - constant space

📌 EXAMPLES  
Sample Input 1: 5 - 5! = 5 × 4 × 3 × 2 × 1 = 120
Sample Input 2: 0 - 0! = 1 by definition`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5", "120"),
        makeCase("2", "0", "1"),
      ],
      [
        makeCase("11", "1", "1"),
        makeCase("12", "10", "3628800"),
        makeCase("13", "3", "6"),
      ]
    ),
  },
  {
    name: "Check Palindrome String",
    slug: "palindrome-string",
    tags: ["string", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You need to check if a given string reads the same forwards and backwards. A palindrome is a word, phrase, or sequence that reads the same backward as forward. For example, "racecar" is a palindrome. This problem teaches string comparison and symmetry checking.

📥 INPUT FORMAT  
A single line containing a string of letters.

📤 OUTPUT FORMAT  
Print "yes" if the string is a palindrome, "no" if it is not. Use lowercase letters.

🧠 WHAT YOU NEED TO DO  
1. Read the input string
2. Compare characters from the start and end moving towards the center
3. If all corresponding characters match, it's a palindrome
4. Print "yes" or "no" accordingly

⚠️ EDGE CASES TO CONSIDER  
- Single character strings (always palindrome)
- Even length strings
- Odd length strings
- All same characters
- Case sensitivity (though samples are lowercase)

⛔ COMMON MISTAKES  
- Not handling the middle character in odd-length strings
- Off-by-one errors in loop bounds
- Wrong comparison logic
- Forgetting case sensitivity
- Using inefficient methods like full string reversal

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(n) - check each character once
Space Complexity: O(1) - no extra space needed

📌 EXAMPLES  
Sample Input 1: "racecar" - reads same forwards and backwards, yes
Sample Input 2: "hello" - "h e l l o" vs "o l l e h", not the same, no`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "racecar", "yes"),
        makeCase("2", "hello", "no"),
      ],
      [
        makeCase("11", "A", "yes"),
        makeCase("12", "Madam", "yes"),
        makeCase("13", "test", "no"),
      ]
    ),
  },
  {
    name: "Sum of Array Elements",
    slug: "sum-of-array",
    tags: ["array", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You have an array of numbers and need to add them all together to get their total sum. This fundamental problem helps you practice array traversal and accumulation, which are core concepts in programming. You'll iterate through each element and keep a running total.

📥 INPUT FORMAT  
First line: a single integer n (the number of elements)
Second line: n integers separated by spaces (the array elements)

📤 OUTPUT FORMAT  
Print a single integer representing the sum of all array elements.

🧠 WHAT YOU NEED TO DO  
1. Read the number n
2. Read the next line containing n integers into an array
3. Initialize a sum variable to 0
4. Loop through each element in the array
5. Add each element to the sum
6. Print the final sum

⚠️ EDGE CASES TO CONSIDER  
- Array with only one element
- All positive numbers
- All negative numbers
- Mix of positive and negative numbers
- Zero values in the array

⛔ COMMON MISTAKES  
- Forgetting to initialize sum to 0
- Using wrong variable for accumulation
- Reading input incorrectly (missing n or array elements)
- Integer overflow with large sums
- Wrong loop bounds

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(n) - we visit each element once
Space Complexity: O(n) - storing the array, or O(1) if processing element by element

📌 EXAMPLES  
Sample Input 1: n=5, array=[1,2,3,4,5], sum=1+2+3+4+5=15
Sample Input 2: n=3, array=[-1,0,1], sum=-1+0+1=0`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5\n1 2 3 4 5", "15"),
        makeCase("2", "3\n-1 0 1", "0"),
      ],
      [
        makeCase("11", "1\n100", "100"),
        makeCase("12", "4\n-5 -10 20 15", "20"),
        makeCase("13", "2\n999 1", "1000"),
      ]
    ),
  },
  {
    name: "Find Minimum Element",
    slug: "find-minimum",
    tags: ["array", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You have an array of numbers and need to find the smallest one. This problem teaches you how to track minimum values while iterating through a collection. You'll compare each element with the current minimum and update it when you find a smaller value.

📥 INPUT FORMAT  
First line: a single integer n (the number of elements)
Second line: n integers separated by spaces (the array elements)

📤 OUTPUT FORMAT  
Print a single integer representing the minimum element in the array.

🧠 WHAT YOU NEED TO DO  
1. Read the number n
2. Read the next line containing n integers into an array
3. Initialize a min variable to the first element
4. Loop through each remaining element
5. If current element is smaller than min, update min
6. Print the final min value

⚠️ EDGE CASES TO CONSIDER  
- Array with only one element
- All elements equal
- Negative numbers
- Very large and very small numbers
- First element is already the minimum

⛔ COMMON MISTAKES  
- Not initializing min to the first element
- Starting loop from index 0 instead of 1
- Using wrong comparison operator
- Forgetting to handle negative numbers
- Wrong variable names or scope

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(n) - we check each element once
Space Complexity: O(n) - storing the array

📌 EXAMPLES  
Sample Input 1: n=5, array=[3,7,2,9,1], minimum is 1
Sample Input 2: n=3, array=[-5,-10,-2], minimum is -10`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5\n3 7 2 9 1", "1"),
        makeCase("2", "1\n42", "42"),
      ],
      [
        makeCase("11", "4\n-5 -1 -10 -2", "-10"),
        makeCase("12", "3\n0 0 0", "0"),
        makeCase("13", "2\n100 -100", "-100"),
      ]
    ),
  },
  {
    name: "two-sum-return-indices",
    slug: "two-sum-return-indices",
    tags: ["array", "hash-map", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description:
      "Given an array of integers and a target sum, find two distinct elements that add up to the target and return their 0-based indices.\n\nThis classic problem introduces the two-pointer technique or hash map approach for finding pairs that sum to a target. It's fundamental in algorithm design.\n\nInput Format:\nThe first line contains two integers: n (array size) and target (the sum to find).\nThe second line contains n space-separated integers, the elements of the array.\n\nOutput Format:\nPrint two space-separated integers i j (0-based indices, i < j) such that arr[i] + arr[j] = target.\nIf no such pair exists, print -1 -1.\n\nConstraints:\n- 2 ≤ n ≤ 10^5\n- -10^9 ≤ array elements ≤ 10^9\n- -2*10^9 ≤ target ≤ 2*10^9\n- Exactly one solution exists (in the main test cases)\n\nSample Input 1:\n4 9\n2 7 11 15\n\nSample Output 1:\n0 1\n\nExplanation:\narr[0] + arr[1] = 2 + 7 = 9, which equals the target.\n\nSample Input 2:\n5 11\n1 3 4 6 7\n\nSample Output 2:\n2 4\n\nExplanation:\narr[2] + arr[4] = 4 + 7 = 11.\n\nNote:\n- Indices must be 0-based and i < j.\n- Each element can be used at most once.\n- Use a hash map to store seen elements and their indices for O(n) time.\n- Alternatively, sort the array and use two pointers.\n- Handle large inputs efficiently.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "4 9\n2 7 11 15", "0 1"),
        makeCase("2", "5 11\n1 3 4 6 7", "2 4"),
      ],
      [
        makeCase("11", "6 18\n5 8 1 2 11 7", "4 5"),
        makeCase("12", "3 100\n1 2 3", "-1 -1"),
        makeCase("13", "5 9\n4 5 2 6 1", "0 3"),
      ]
    ),
  },

  // Easy 11-20
  {
    name: "valid-parentheses",
    slug: "valid-parentheses",
    tags: ["stack", "string", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description:
      "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nA string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.\n- Every close bracket has a corresponding open bracket of the same type.\n\nThis problem teaches stack data structure usage for parsing and validation.\n\nInput Format:\nA single line containing the string s to validate.\n\nOutput Format:\nPrint 'true' if the string is valid, 'false' otherwise.\n\nConstraints:\n- 1 ≤ s.length ≤ 10^4\n- s consists only of parentheses '()[]{}'\n\nSample Input 1:\n()\n\nSample Output 1:\ntrue\n\nExplanation:\nThe brackets are properly matched and closed.\n\nSample Input 2:\n([{}])\n\nSample Output 2:\ntrue\n\nExplanation:\nAll brackets are correctly nested and matched.\n\nSample Input 3:\n(]\n\nSample Output 3:\nfalse\n\nExplanation:\n'(' is not closed by ')', and ')' has no matching open bracket.\n\nNote:\n- Use a stack to keep track of opening brackets.\n- When encountering a closing bracket, check if it matches the top of the stack.\n- If stack is empty when closing or mismatch, invalid.\n- At end, stack should be empty for valid string.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "()[]{}", "true"),
        makeCase("2", "(]", "false"),
      ],
      [
        makeCase("11", "([{}])", "true"),
        makeCase("12", "(((()", "false"),
        makeCase("13", "{[()]}", "true"),
      ]
    ),
  },
  {
    name: "binary-search-first-occurrence",
    slug: "binary-search-first-occurrence",
    tags: ["binary-search", "array", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You have a sorted array and need to find the first position where a target value appears. This problem introduces binary search with a twist - handling duplicates by finding the leftmost occurrence. You'll use the efficient binary search algorithm but modify it to continue searching for earlier occurrences.

📥 INPUT FORMAT  
First line: two integers n (array size) and target (value to find)
Second line: n sorted integers (the array)

📤 OUTPUT FORMAT  
Print the 0-based index of the first occurrence of target, or -1 if not found.

🧠 WHAT YOU NEED TO DO  
1. Read n and target
2. Read the sorted array
3. Use binary search to find target
4. When target is found, search left half for earlier occurrences
5. Return the leftmost index or -1

⚠️ EDGE CASES TO CONSIDER  
- Target not in array
- Target appears only once
- Target appears multiple times
- Target is first or last element
- All elements are same as target

⛔ COMMON MISTAKES  
- Not finding the first occurrence (returning middle instead of leftmost)
- Wrong binary search bounds
- Not handling duplicates correctly
- Off-by-one errors in indices
- Forgetting edge cases

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(log n) - binary search
Space Complexity: O(1) - no extra space

📌 EXAMPLES  
Sample Input 1: n=7, target=2, array=[1,2,2,2,3,4,5], first occurrence at index 1
Sample Input 2: n=5, target=8, array=[1,3,5,7,9], not found, return -1`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "7 2\n1 2 2 2 3 4 5", "1"),
        makeCase("2", "5 8\n1 3 5 7 9", "-1"),
      ],
      [
        makeCase("11", "6 10\n10 10 10 10 11 12", "0"),
        makeCase("12", "8 6\n1 2 3 4 5 6 7 8", "5"),
        makeCase("13", "4 1\n1 1 1 1", "0"),
      ]
    ),
  },
  {
    name: "longest-substring-without-repeating",
    slug: "longest-substring-without-repeating",
    tags: ["string", "sliding-window", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You have a string and need to find the longest continuous sequence of characters where no character repeats. This problem teaches the sliding window technique, which is powerful for substring problems. You'll maintain a window of unique characters and expand it while tracking the maximum length.

📥 INPUT FORMAT  
A single line containing the string s.

📤 OUTPUT FORMAT  
Print a single integer representing the length of the longest substring without repeating characters.

🧠 WHAT YOU NEED TO DO  
1. Read the input string
2. Use two pointers to maintain a sliding window
3. Use a set to track characters in current window
4. Expand right pointer, add characters to set
5. If duplicate found, move left pointer and remove characters
6. Track maximum window size
7. Return the maximum length

⚠️ EDGE CASES TO CONSIDER  
- Empty string (length 0)
- All unique characters
- All same characters
- String with only one character
- Very long strings with no repeats

⛔ COMMON MISTAKES  
- Not using sliding window correctly
- Wrong set operations (adding/removing)
- Not updating maximum length properly
- Off-by-one errors in window size
- Forgetting to handle empty string

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(n) - each character visited at most twice
Space Complexity: O(min(n, charset)) - set size limited by character set

📌 EXAMPLES  
Sample Input 1: "abcabcbb" - longest is "abc" with length 3
Sample Input 2: "bbbbb" - longest is "b" with length 1`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "abcabcbb", "3"),
        makeCase("2", "bbbbb", "1"),
      ],
      [
        makeCase("11", "pwwkew", "3"),
        makeCase("12", "dvdf", "3"),
        makeCase("13", "anviaj", "5"),
      ]
    ),
  },
  {
    name: "maximum-subarray-sum",
    slug: "maximum-subarray-sum",
    tags: ["array", "dynamic-programming", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description:
      "Given an array of integers, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\n\nA subarray is a contiguous part of the array. This is a classic problem that can be solved using Kadane's algorithm, which runs in O(n) time.\n\nInput Format:\nThe first line contains an integer n (1 ≤ n ≤ 10^5), the size of the array.\nThe second line contains n space-separated integers, the elements of the array.\n\nOutput Format:\nPrint a single integer, the maximum sum of any contiguous subarray.\n\nConstraints:\n- 1 ≤ n ≤ 10^5\n- -10^5 ≤ array elements ≤ 10^5\n\nSample Input 1:\n9\n-2 1 -3 4 -1 2 1 -5 4\n\nSample Output 1:\n6\n\nExplanation:\nThe subarray [4, -1, 2, 1] has sum 6, which is the maximum.\n\nSample Input 2:\n5\n1 2 3 4 5\n\nSample Output 2:\n15\n\nExplanation:\nThe entire array has the maximum sum.\n\nNote:\n- The subarray must contain at least one element.\n- Use Kadane's algorithm: keep track of current sum and maximum sum.\n- Reset current sum to 0 when it becomes negative.\n- Handle all negative numbers case (return the largest negative number).",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "9\n-2 1 -3 4 -1 2 1 -5 4", "6"),
        makeCase("2", "5\n1 2 3 4 5", "15"),
      ],
      [
        makeCase("11", "6\n-1 -2 -3 -4 -5 -6", "-1"),
        makeCase("12", "8\n5 -2 3 4 -1 2 -1 6", "16"),
        makeCase("13", "1\n7", "7"),
      ]
    ),
  },
  {
    name: "number-of-islands-grid",
    slug: "number-of-islands-grid",
    tags: ["graph", "dfs", "bfs", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description:
      "Given a 2D grid consisting of '1's (land) and '0's (water), count the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.\n\nThis is a graph traversal problem where each land cell is a node, and adjacent lands are connected. You can use DFS or BFS to explore each island.\n\nInput Format:\nThe first line contains two integers r and c (1 ≤ r, c ≤ 100), the number of rows and columns.\nThe next r lines each contain c binary digits (0 or 1) representing the grid.\n\nOutput Format:\nPrint a single integer, the number of islands in the grid.\n\nConstraints:\n- 1 ≤ r, c ≤ 100\n- Grid cells are either '0' or '1'.\n\nSample Input 1:\n4 5\n11000\n11000\n00100\n00011\n\nSample Output 1:\n3\n\nExplanation:\nThere are 3 islands: the top-left connected 1's, the middle-right 1, and the bottom-right connected 1's.\n\nSample Input 2:\n3 3\n111\n010\n111\n\nSample Output 2:\n1\n\nExplanation:\nAll 1's are connected, forming one island.\n\nNote:\n- Adjacent means up, down, left, right (not diagonal).\n- Use DFS or BFS to mark visited cells.\n- Iterate through each cell, and if it's land and not visited, start a new island count.\n- Modify the grid in-place or use a visited matrix.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "4 5\n11000\n11000\n00100\n00011", "3"),
        makeCase("2", "3 3\n111\n010\n111", "1"),
      ],
      [
        makeCase("11", "5 5\n11011\n10001\n00100\n10101\n11111", "3"),
        makeCase("12", "2 4\n0000\n0000", "0"),
        makeCase("13", "1 1\n1", "1"),
      ]
    ),
  },
  {
    name: "Count Occurrences",
    slug: "count-occurrences",
    tags: ["array", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description:
      "Given an array of integers and a target value, count how many times the target appears in the array.\n\nThis is a simple counting problem that helps practice array traversal and conditional checks. It's useful for understanding frequency counting.\n\nInput Format:\nThe first line contains an integer n (1 ≤ n ≤ 1000), the size of the array.\nThe second line contains n space-separated integers, the elements of the array.\nThe third line contains a single integer, the target value to count.\n\nOutput Format:\nPrint a single integer, the number of times the target appears in the array.\n\nConstraints:\n- 1 ≤ n ≤ 1000\n- -1000 ≤ array elements, target ≤ 1000\n\nSample Input 1:\n5\n1 2 2 3 2\n2\n\nSample Output 1:\n3\n\nExplanation:\nThe target 2 appears at positions 2, 3, and 5 (1-based), so count is 3.\n\nSample Input 2:\n4\n5 5 5 5\n5\n\nSample Output 2:\n4\n\nExplanation:\nAll elements are 5, so count is 4.\n\nNote:\n- The target may not appear at all (count 0).\n- Use a loop to iterate through the array and increment a counter when the element matches the target.\n- Handle negative numbers and zeros correctly.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5\n1 2 2 3 2\n2", "3"),
        makeCase("2", "4\n5 5 5 5\n5", "4"),
      ],
      [
        makeCase("11", "3\n1 2 3\n4", "0"),
        makeCase("12", "6\n1 1 1 2 2 3\n1", "3"),
        makeCase("13", "1\n7\n7", "1"),
      ]
    ),
  },
  {
    name: "Average of Array",
    slug: "average-of-array",
    tags: ["array", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW  
You need to calculate the average (mean) of all numbers in an array. The average is the sum of all elements divided by the number of elements. This problem teaches you about summation and division operations, plus careful handling of integer division.

📥 INPUT FORMAT  
First line: a single integer n (the number of elements)
Second line: n integers separated by spaces (the array elements)

📤 OUTPUT FORMAT  
Print a single integer representing the average (sum divided by n, truncated to integer).

🧠 WHAT YOU NEED TO DO  
1. Read the number n
2. Read the next line containing n integers into an array
3. Calculate the sum of all elements
4. Divide the sum by n (integer division)
5. Print the result

⚠️ EDGE CASES TO CONSIDER  
- All positive numbers
- All negative numbers
- Mix of positive and negative numbers
- Zeros in the array
- Single element array
- Large numbers that might cause overflow

⛔ COMMON MISTAKES  
- Using floating point division instead of integer division
- Not handling negative numbers correctly
- Wrong order of reading input
- Integer overflow when summing
- Forgetting to truncate the result

💡 COMPLEXITY EXPECTATION  
Time Complexity: O(n) - we visit each element once
Space Complexity: O(n) - storing the array

📌 EXAMPLES  
Sample Input 1: n=4, array=[10,20,30,40], sum=100, average=100/4=25
Sample Input 2: n=3, array=[1,2,3], sum=6, average=6/3=2`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "4\n10 20 30 40", "25"),
        makeCase("2", "3\n1 2 3", "2"),
      ],
      [
        makeCase("11", "5\n5 5 5 5 5", "5"),
        makeCase("12", "2\n0 1", "0"),
        makeCase("13", "3\n9 9 9", "9"),
      ]
    ),
  },
  {
    name: "Power of a Number",
    slug: "power-of-number",
    tags: ["math", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Calculate the power of a number by raising a base to an exponent (base^exponent). This is a fundamental mathematical operation that appears frequently in programming challenges.

📥 INPUT FORMAT
First line: Two space-separated integers base and exponent

📤 OUTPUT FORMAT
A single integer representing base raised to the power of exponent

🔒 CONSTRAINTS
- 0 ≤ base ≤ 10
- 0 ≤ exponent ≤ 10

🧠 APPROACH & ALGORITHM
1. Read base and exponent from input
2. Use built-in power function or implement exponentiation by squaring
3. Handle edge cases (base=0, exponent=0)
4. Output the result

⚠️ EDGE CASES TO CONSIDER
- Base is 0, exponent is 0 (0^0 is typically 1 in programming)
- Base is 0, exponent > 0 (result is 0)
- Exponent is 0 (any number^0 = 1, except 0^0)
- Maximum values (10^10)

⛔ COMMON MISTAKES
- Not handling 0^0 case correctly
- Using floating point operations instead of integers
- Integer overflow for large results
- Wrong input parsing

💡 COMPLEXITY EXPECTATION
Time Complexity: O(log exponent) - using efficient exponentiation
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: 2 5
Sample Output 1: 32
Explanation: 2^5 = 32

Sample Input 2: 3 0
Sample Output 2: 1
Explanation: Any number raised to 0 is 1`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "2 5", "32"),
        makeCase("2", "3 3", "27"),
      ],
      [
        makeCase("11", "10 2", "100"),
        makeCase("12", "5 0", "1"),
        makeCase("13", "2 10", "1024"),
      ]
    ),
  },
  {
    name: "Check Perfect Square",
    slug: "perfect-square",
    tags: ["math", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Determine if a given non-negative integer is a perfect square. A perfect square is an integer that can be expressed as the square of another integer (n = k² where k is an integer).

📥 INPUT FORMAT
A single line containing a non-negative integer n

📤 OUTPUT FORMAT
Print 'yes' if n is a perfect square, 'no' otherwise

🔒 CONSTRAINTS
- 0 ≤ n ≤ 10^6

🧠 APPROACH & ALGORITHM
1. Read the integer n from input
2. Calculate the square root of n
3. Check if the square root is an integer (floor(sqrt(n))² == n)
4. Output 'yes' or 'no' accordingly

⚠️ EDGE CASES TO CONSIDER
- n = 0 (0 is a perfect square: 0² = 0)
- n = 1 (1 is a perfect square: 1² = 1)
- Large perfect squares (1000000 = 1000²)
- Non-perfect squares close to perfect squares (17, 24, etc.)

⛔ COMMON MISTAKES
- Using floating point precision issues with sqrt()
- Not handling n=0 correctly
- Integer overflow when computing squares
- Wrong comparison logic

💡 COMPLEXITY EXPECTATION
Time Complexity: O(1) - constant time operations
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: 16
Sample Output 1: yes
Explanation: 4 × 4 = 16

Sample Input 2: 17
Sample Output 2: no
Explanation: No integer squared equals 17

Sample Input 3: 1
Sample Output 3: yes
Explanation: 1 × 1 = 1`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "16", "yes"),
        makeCase("2", "17", "no"),
      ],
      [
        makeCase("11", "1", "yes"),
        makeCase("12", "0", "yes"),
        makeCase("13", "100", "yes"),
      ]
    ),
  },
  {
    name: "Absolute Value",
    slug: "absolute-value",
    tags: ["math", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Compute the absolute value (magnitude) of a given integer. The absolute value represents the distance of a number from zero on the number line, always resulting in a non-negative value.

📥 INPUT FORMAT
A single line containing an integer n

📤 OUTPUT FORMAT
Print a single integer representing the absolute value of n

🔒 CONSTRAINTS
- -10^6 ≤ n ≤ 10^6

🧠 APPROACH & ALGORITHM
1. Read the integer n from input
2. If n is negative, multiply by -1 (or use built-in abs function)
3. If n is positive or zero, keep as is
4. Output the result

⚠️ EDGE CASES TO CONSIDER
- Negative numbers (should become positive)
- Positive numbers (remain unchanged)
- Zero (absolute value is 0)
- Minimum negative value (-1000000)

⛔ COMMON MISTAKES
- Forgetting to handle negative numbers
- Using incorrect logic for zero
- Not using built-in functions when available
- Type conversion issues

💡 COMPLEXITY EXPECTATION
Time Complexity: O(1) - constant time
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: -42
Sample Output 1: 42
Explanation: |-42| = 42

Sample Input 2: 42
Sample Output 2: 42
Explanation: |42| = 42

Sample Input 3: 0
Sample Output 3: 0
Explanation: |0| = 0`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "-42", "42"),
        makeCase("2", "42", "42"),
      ],
      [
        makeCase("11", "0", "0"),
        makeCase("12", "-1000000", "1000000"),
        makeCase("13", "999", "999"),
      ]
    ),
  },

  // Easy 21-30
  {
    name: "GCD using Euclidean Algorithm",
    slug: "gcd-euclidean",
    tags: ["math", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Find the Greatest Common Divisor (GCD) of two positive integers using the Euclidean algorithm. GCD is the largest positive integer that divides both numbers without leaving a remainder.

📥 INPUT FORMAT
A single line containing two space-separated positive integers a and b

📤 OUTPUT FORMAT
Print a single integer representing the GCD of a and b

🔒 CONSTRAINTS
- 1 ≤ a, b ≤ 10^5

🧠 APPROACH & ALGORITHM
1. Read two integers a and b from input
2. Apply Euclidean algorithm: gcd(a,b) = gcd(b, a mod b)
3. Repeat until b becomes 0, then a is the GCD
4. Output the result

⚠️ EDGE CASES TO CONSIDER
- One number is multiple of the other (like 10, 5)
- Both numbers are equal
- One number is 1 (GCD is always 1)
- Coprime numbers (GCD = 1)

⛔ COMMON MISTAKES
- Not handling the case when b > a initially
- Wrong modulo operation
- Infinite loop if not updating variables correctly
- Not using efficient algorithm for large numbers

💡 COMPLEXITY EXPECTATION
Time Complexity: O(log min(a,b)) - Euclidean algorithm is very efficient
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: 48 18
Sample Output 1: 6
Explanation: gcd(48,18) = 6

Sample Input 2: 10 5
Sample Output 2: 5
Explanation: 5 divides both 10 and 5

Sample Input 3: 17 19
Sample Output 3: 1
Explanation: 17 and 19 are coprime`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "48 18", "6"),
        makeCase("2", "10 5", "5"),
      ],
      [
        makeCase("11", "100 50", "50"),
        makeCase("12", "17 19", "1"),
        makeCase("13", "21 14", "7"),
      ]
    ),
  },
  {
    name: "LCM of Two Numbers",
    slug: "lcm-two-numbers",
    tags: ["math", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Find the Least Common Multiple (LCM) of two positive integers. LCM is the smallest positive integer that is divisible by both numbers. It can be calculated using the relationship: LCM(a,b) = (a × b) / GCD(a,b).

📥 INPUT FORMAT
A single line containing two space-separated positive integers a and b

📤 OUTPUT FORMAT
Print a single integer representing the LCM of a and b

🔒 CONSTRAINTS
- 1 ≤ a, b ≤ 1000

🧠 APPROACH & ALGORITHM
1. Read two integers a and b from input
2. Calculate GCD of a and b using Euclidean algorithm
3. Use formula: LCM = (a × b) / GCD
4. Output the result

⚠️ EDGE CASES TO CONSIDER
- One number divides the other (LCM = larger number)
- Both numbers are equal (LCM = the number)
- Coprime numbers (LCM = a × b)
- Small numbers (1 with any number)

⛔ COMMON MISTAKES
- Integer overflow when multiplying a and b
- Not calculating GCD correctly first
- Division by zero (though GCD is always ≥ 1)
- Wrong formula application

💡 COMPLEXITY EXPECTATION
Time Complexity: O(log min(a,b)) - dominated by GCD calculation
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: 12 18
Sample Output 1: 36
Explanation: LCM(12,18) = 36

Sample Input 2: 5 7
Sample Output 2: 35
Explanation: 5 and 7 are coprime, LCM = 5×7 = 35

Sample Input 3: 4 6
Sample Output 3: 12
Explanation: LCM(4,6) = 12`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "12 18", "36"),
        makeCase("2", "5 7", "35"),
      ],
      [
        makeCase("11", "4 6", "12"),
        makeCase("12", "10 10", "10"),
        makeCase("13", "100 50", "100"),
      ]
    ),
  },
  {
    name: "Check Prime Number",
    slug: "check-prime",
    tags: ["math", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Determine if a given positive integer greater than 1 is a prime number. A prime number has exactly two distinct positive divisors: 1 and itself. Examples include 2, 3, 5, 7, 11, etc.

📥 INPUT FORMAT
A single line containing a positive integer n (n > 1)

📤 OUTPUT FORMAT
Print 'prime' if n is a prime number, 'not prime' otherwise

🔒 CONSTRAINTS
- 2 ≤ n ≤ 10^4

🧠 APPROACH & ALGORITHM
1. Read the integer n from input
2. Check if n is 2 (only even prime)
3. If n > 2 and even, it's not prime
4. Check divisibility from 3 to sqrt(n), skipping even numbers
5. If no divisors found, it's prime

⚠️ EDGE CASES TO CONSIDER
- n = 2 (smallest prime, only even prime)
- Even numbers greater than 2 (all composite)
- Perfect squares that are not prime (9, 25, etc.)
- Large prime numbers within constraints

⛔ COMMON MISTAKES
- Not handling n=2 correctly
- Checking divisibility up to n-1 instead of sqrt(n)
- Not skipping even numbers for efficiency
- Wrong output format ('Prime' vs 'prime')

💡 COMPLEXITY EXPECTATION
Time Complexity: O(sqrt(n)) - checking up to square root
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: 17
Sample Output 1: prime
Explanation: 17 has no divisors other than 1 and 17

Sample Input 2: 4
Sample Output 2: not prime
Explanation: 4 = 2 × 2, divisible by 2

Sample Input 3: 2
Sample Output 3: prime
Explanation: 2 is the smallest prime number`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "17", "prime"),
        makeCase("2", "4", "not prime"),
      ],
      [
        makeCase("11", "2", "prime"),
        makeCase("12", "1", "not prime"),
        makeCase("13", "97", "prime"),
      ]
    ),
  },
  {
    name: "Digit Sum",
    slug: "digit-sum",
    tags: ["math", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Calculate the sum of all individual digits in a given number. For example, the digit sum of 12345 is 1+2+3+4+5 = 15. This is a fundamental operation often used in number theory and checksum calculations.

📥 INPUT FORMAT
A single positive integer n

📤 OUTPUT FORMAT
A single integer representing the sum of all digits in n

🔒 CONSTRAINTS
- 1 ≤ n ≤ 10^6

🧠 APPROACH & ALGORITHM
1. Read the integer n from input
2. Initialize sum = 0
3. While n > 0:
   - Extract last digit: digit = n % 10
   - Add to sum: sum += digit
   - Remove last digit: n = n / 10
4. Output the final sum

⚠️ EDGE CASES TO CONSIDER
- Single digit number (sum equals the number itself)
- Number with all zeros (sum = 0, but n starts from 1)
- Maximum constraint (10^6 = 1000000, sum = 1)
- Numbers with repeated digits

⛔ COMMON MISTAKES
- Using string conversion instead of mathematical approach
- Wrong division operator (using float division)
- Not handling the loop termination correctly
- Forgetting to initialize sum to 0

💡 COMPLEXITY EXPECTATION
Time Complexity: O(d) where d is number of digits (up to 7 for 10^6)
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: 12345
Sample Output 1: 15
Explanation: 1+2+3+4+5 = 15

Sample Input 2: 100
Sample Output 2: 1
Explanation: 1+0+0 = 1

Sample Input 3: 999999
Sample Output 3: 54
Explanation: 9×6 = 54`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "12345", "15"),
        makeCase("2", "9999", "36"),
      ],
      [
        makeCase("11", "1", "1"),
        makeCase("12", "100", "1"),
        makeCase("13", "555", "15"),
      ]
    ),
  },
  {
    name: "Armstrong Number Check",
    slug: "armstrong-check",
    tags: ["math", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Check if a given number is an Armstrong number (also called narcissistic number). An Armstrong number is a number that is equal to the sum of its own digits each raised to the power of the number of digits.

📥 INPUT FORMAT
A single integer n

📤 OUTPUT FORMAT
Print 'yes' if n is an Armstrong number, 'no' otherwise

🔒 CONSTRAINTS
- 1 ≤ n ≤ 10^6

🧠 APPROACH & ALGORITHM
1. Read the integer n from input
2. Count the number of digits in n
3. Calculate sum of each digit raised to the power of digit count
4. Compare sum with original number
5. Output 'yes' or 'no'

⚠️ EDGE CASES TO CONSIDER
- Single digit numbers (all are Armstrong numbers)
- Perfect powers (like 1, 8, etc.)
- Numbers with different digit counts
- Maximum constraint (10^6)

⛔ COMMON MISTAKES
- Wrong power calculation (using wrong exponent)
- Not counting digits correctly
- Integer overflow for large numbers
- Wrong comparison logic

💡 COMPLEXITY EXPECTATION
Time Complexity: O(d) where d is number of digits
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: 153
Sample Output 1: yes
Explanation: 1³ + 5³ + 3³ = 1 + 125 + 27 = 153

Sample Input 2: 123
Sample Output 2: no
Explanation: 1³ + 2³ + 3³ = 1 + 8 + 27 = 36 ≠ 123

Sample Input 3: 9474
Sample Output 3: yes
Explanation: 9⁴ + 4⁴ + 7⁴ + 4⁴ = 6561 + 256 + 2401 + 256 = 9474`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "153", "yes"),
        makeCase("2", "123", "no"),
      ],
      [
        makeCase("11", "9474", "yes"),
        makeCase("12", "100", "no"),
        makeCase("13", "1", "yes"),
      ]
    ),
  },
  {
    name: "Simple Calculator",
    slug: "simple-calculator",
    tags: ["arithmetic", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Implement a simple calculator that performs basic arithmetic operations: addition, subtraction, multiplication, and integer division. This problem teaches input parsing, operator handling, and basic arithmetic operations in programming.

📥 INPUT FORMAT
A single line containing three space-separated values: number1 operator number2
- number1 and number2 are integers
- operator is one of: +, -, *, /

📤 OUTPUT FORMAT
Print a single integer representing the result of the operation (integer division truncates towards zero)

🔒 CONSTRAINTS
- -10^6 ≤ number1, number2 ≤ 10^6
- number2 ≠ 0 (division by zero won't occur)

🧠 APPROACH & ALGORITHM
1. Read the input line and split into three parts: num1, op, num2
2. Convert num1 and num2 to integers
3. Use conditional statements to perform the appropriate operation
4. Output the result

⚠️ EDGE CASES TO CONSIDER
- Negative numbers in operations
- Division resulting in negative numbers (truncation)
- Multiplication of large numbers (within int range)
- Addition/subtraction of numbers with different signs

⛔ COMMON MISTAKES
- Wrong operator precedence (not applicable here)
- Not handling negative results correctly
- Using floating point division instead of integer division
- Input parsing errors (not splitting correctly)

💡 COMPLEXITY EXPECTATION
Time Complexity: O(1) - constant time operations
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: 10 + 5
Sample Output 1: 15
Explanation: 10 + 5 = 15

Sample Input 2: 10 - 5
Sample Output 2: 5
Explanation: 10 - 5 = 5

Sample Input 3: 7 / 2
Sample Output 3: 3
Explanation: 7 ÷ 2 = 3 (integer division)`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "10 + 5", "15"),
        makeCase("2", "10 - 5", "5"),
      ],
      [
        makeCase("11", "10 * 5", "50"),
        makeCase("12", "10 / 5", "2"),
        makeCase("13", "7 / 2", "3"),
      ]
    ),
  },
  {
    name: "First Repeating Character",
    slug: "first-repeating-char",
    tags: ["string", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Find the first character that appears more than once in a given string. This problem introduces string processing and frequency tracking, requiring you to identify the earliest duplicate character when scanning from left to right.

📥 INPUT FORMAT
A single line containing the string s

📤 OUTPUT FORMAT
Print the first repeating character in the string, or -1 if no character repeats

🔒 CONSTRAINTS
- 1 ≤ s.length ≤ 1000
- s consists of lowercase English letters only

🧠 APPROACH & ALGORITHM
1. Read the string s from input
2. Use a set or frequency array to track seen characters
3. Iterate through each character from left to right
4. For each character, check if it's already seen
5. If seen, return it (first repeating character)
6. If not seen, add to tracking structure
7. If no repeats found, return -1

⚠️ EDGE CASES TO CONSIDER
- All unique characters (return -1)
- First character repeats immediately
- Last character repeats with earlier one
- Multiple possible repeating characters (return first one)
- String length 1 (no repeats possible)

⛔ COMMON MISTAKES
- Returning last repeating character instead of first
- Not handling case sensitivity (all lowercase given)
- Wrong data structure choice
- Off-by-one errors in indexing

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n) - single pass through string
Space Complexity: O(1) - fixed size alphabet (26 letters)

📌 EXAMPLES
Sample Input 1: abcabc
Sample Output 1: a
Explanation: 'a' appears at positions 0 and 3, first repeat

Sample Input 2: abcdef
Sample Output 2: -1
Explanation: All characters are unique

Sample Input 3: hello
Sample Output 3: l
Explanation: 'l' appears at positions 2 and 3, first repeat`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "abcabc", "a"),
        makeCase("2", "abcdef", "-1"),
      ],
      [
        makeCase("11", "hello", "l"),
        makeCase("12", "xyz", "-1"),
        makeCase("13", "aabbcc", "a"),
      ]
    ),
  },
  {
    name: "Remove Duplicates from Array",
    slug: "remove-duplicates",
    tags: ["array", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Remove all duplicate elements from an array while preserving the order of first occurrences. This problem teaches array manipulation and using data structures to track unique elements efficiently.

📥 INPUT FORMAT
First line: integer n (array size)
Second line: n space-separated integers

📤 OUTPUT FORMAT
Print the unique elements in order of their first appearance, space-separated

🔒 CONSTRAINTS
- 1 ≤ n ≤ 1000
- -1000 ≤ array elements ≤ 1000

🧠 APPROACH & ALGORITHM
1. Read n, the size of array
2. Read the array of n integers
3. Use a set or similar structure to track seen elements
4. Iterate through array, adding elements to result only if not seen before
5. Print the result array

⚠️ EDGE CASES TO CONSIDER
- All elements are unique (no changes)
- All elements are the same (single element result)
- Array with single element
- Negative numbers and zeros
- Large range of values

⛔ COMMON MISTAKES
- Not preserving order of first occurrences
- Using sorting which changes order
- Wrong output format (missing spaces, extra spaces)
- Not handling negative numbers correctly

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n) - single pass through array
Space Complexity: O(n) - storing unique elements

📌 EXAMPLES
Sample Input 1:
5
1 2 2 3 1
Sample Output 1: 1 2 3
Explanation: First occurrences: 1, 2, 3

Sample Input 2:
6
4 4 4 4 4 4
Sample Output 2: 4
Explanation: Only one unique element

Sample Input 3:
3
1 2 3
Sample Output 3: 1 2 3
Explanation: No duplicates, all elements kept`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5\n1 2 2 3 1", "1 2 3"),
        makeCase("2", "4\n1 1 1 1", "1"),
      ],
      [
        makeCase("11", "3\n3 2 1", "3 2 1"),
        makeCase("12", "6\n5 5 5 5 5 5", "5"),
        makeCase("13", "1\n42", "42"),
      ]
    ),
  },
  {
    name: "Find Maximum Element",
    slug: "find-maximum",
    tags: ["array", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Find the largest element in an array of integers. This fundamental problem teaches array traversal and comparison operations, building the foundation for more complex array algorithms.

📥 INPUT FORMAT
First line: n (number of elements)
Second line: n space-separated integers

📤 OUTPUT FORMAT
A single integer representing the maximum element in the array

🔒 CONSTRAINTS
- 1 ≤ n ≤ 1000
- -10^6 ≤ arr[i] ≤ 10^6

🧠 APPROACH & ALGORITHM
1. Read n, the array size
2. Read the array of n integers
3. Initialize max with first element
4. Iterate through remaining elements
5. Update max if current element is larger
6. Output the maximum value

⚠️ EDGE CASES TO CONSIDER
- All elements are negative (maximum is least negative)
- Array with single element
- All elements are equal
- Mix of positive and negative numbers
- Zero in the array

⛔ COMMON MISTAKES
- Not initializing max correctly
- Starting loop from index 0 instead of 1
- Wrong comparison operator
- Not handling negative numbers
- Array index out of bounds

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n) - single pass through array
Space Complexity: O(n) - storing the array

📌 EXAMPLES
Sample Input 1:
5
3 7 2 9 1
Sample Output 1: 9
Explanation: 9 is the largest element

Sample Input 2:
1
42
Sample Output 2: 42
Explanation: Single element is the maximum

Sample Input 3:
4
-5 -1 -10 -2
Sample Output 3: -1
Explanation: -1 is largest among negative numbers`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5\n3 7 2 9 1", "9"),
        makeCase("2", "1\n42", "42"),
      ],
      [
        makeCase("11", "4\n-5 -1 -10 -2", "-1"),
        makeCase("12", "3\n0 0 0", "0"),
        makeCase("13", "2\n100 -100", "100"),
      ]
    ),
  },

  // ==================== MEDIUM PROBLEMS (40) ====================

  {
    name: "Merge Two Sorted Arrays",
    slug: "merge-sorted-arrays",
    tags: ["array", "sorting", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Merge two sorted arrays into a single sorted array. This problem demonstrates efficient merging techniques and is fundamental to sorting algorithms like merge sort.

📥 INPUT FORMAT
First line: two integers n m (sizes of arrays)
Second line: n sorted integers
Third line: m sorted integers

📤 OUTPUT FORMAT
Single line with all elements from both arrays in sorted order, space-separated

🔒 CONSTRAINTS
- 1 ≤ n, m ≤ 10^5
- -10^9 ≤ arr[i] ≤ 10^9

🧠 APPROACH & ALGORITHM
1. Read n and m, the sizes of two arrays
2. Read first array of n sorted integers
3. Read second array of m sorted integers
4. Use two pointers to merge arrays efficiently
5. Compare elements and add smaller one to result
6. Handle remaining elements from either array

⚠️ EDGE CASES TO CONSIDER
- One array is empty (n=0 or m=0)
- Arrays with duplicate elements
- All elements in one array smaller than other
- Negative numbers and large ranges
- Maximum size arrays

⛔ COMMON MISTAKES
- Not handling empty arrays correctly
- Wrong merge logic (not comparing properly)
- Memory issues with large arrays
- Not preserving sorted order
- Wrong output format

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n + m) - linear merge
Space Complexity: O(n + m) - storing result

📌 EXAMPLES
Sample Input 1:
3 2
1 3 5
2 4
Sample Output 1: 1 2 3 4 5
Explanation: Merging [1,3,5] and [2,4] gives [1,2,3,4,5]

Sample Input 2:
2 2
1 2
3 4
Sample Output 2: 1 2 3 4
Explanation: Both arrays already sorted, simple concatenation

Sample Input 3:
1 3
5
1 2 3
Sample Output 3: 1 2 3 5
Explanation: Single element merged with sorted array`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3 2\n1 3 5\n2 4", "1 2 3 4 5"),
        makeCase("2", "2 2\n1 2\n3 4", "1 2 3 4"),
      ],
      [
        makeCase("11", "1 3\n5\n1 2 3", "1 2 3 5"),
        makeCase("12", "0 1\n7", "7"),
        makeCase("13", "3 3\n1 5 9\n2 6 10", "1 2 5 6 9 10"),
      ]
    ),
  },
  {
    name: "Container with Most Water",
    slug: "container-water",
    tags: ["array", "two-pointers", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Given heights of vertical lines on a coordinate plane, find two lines that form a container holding the maximum water with the x-axis. This classic problem showcases the two-pointer technique for optimal solutions.

📥 INPUT FORMAT
First line: integer n (number of lines)
Second line: n space-separated integers (heights)

📤 OUTPUT FORMAT
Single integer representing maximum water area

🔒 CONSTRAINTS
- 2 ≤ n ≤ 10^5
- 0 ≤ height[i] ≤ 10^4

🧠 APPROACH & ALGORITHM
1. Read n and the array of heights
2. Initialize two pointers at start and end
3. Calculate area: min(height[i], height[j]) × (j - i)
4. Track maximum area found
5. Move the pointer with smaller height inward
6. Repeat until pointers meet

⚠️ EDGE CASES TO CONSIDER
- All heights equal
- Heights in increasing order
- Heights in decreasing order
- Minimum heights (zeros)
- Maximum constraints

⛔ COMMON MISTAKES
- Moving wrong pointer (should move shorter height)
- Not calculating area correctly
- Wrong initialization of max area
- Edge case handling for small n

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n) - single pass with two pointers
Space Complexity: O(1) - constant extra space

📌 EXAMPLES
Sample Input 1:
9
1 8 6 2 5 4 8 3 7
Sample Output 1: 49
Explanation: Lines at positions 1(8) and 8(7): min(8,7)×7 = 49

Sample Input 2:
2
1 1
Sample Output 2: 1
Explanation: min(1,1)×1 = 1

Sample Input 3:
5
2 3 4 5 18
Sample Output 3: 17
Explanation: Lines at positions 0(2) and 4(18): min(2,18)×4 = 8, or positions 3(5) and 4(18): min(5,18)×1 = 5, etc.`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "9\n1 8 6 2 5 4 8 3 7", "49"),
        makeCase("2", "2\n1 1", "1"),
      ],
      [
        makeCase("11", "5\n2 3 4 5 18", "17"),
        makeCase("12", "3\n1 2 1", "2"),
        makeCase("13", "4\n4 3 2 1", "4"),
      ]
    ),
  },
  {
    name: "Three Sum Zero",
    slug: "three-sum",
    tags: ["array", "sorting", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Find all unique triplets in an array that sum to zero. This problem extends the two-sum concept to three numbers and requires careful handling of duplicates and efficient searching.

📥 INPUT FORMAT
First line: integer n (array size)
Second line: n space-separated integers

📤 OUTPUT FORMAT
Each triplet on separate lines, elements space-separated and sorted ascending. No duplicates.

🔒 CONSTRAINTS
- 3 ≤ n ≤ 3000
- -10^5 ≤ nums[i] ≤ 10^5

🧠 APPROACH & ALGORITHM
1. Sort the array
2. For each element, use two pointers to find pairs that sum to -current
3. Skip duplicates to avoid repeated triplets
4. Track unique triplets found

⚠️ EDGE CASES TO CONSIDER
- Multiple zeros
- All negative numbers
- All positive numbers
- Array with duplicates
- No valid triplets

⛔ COMMON MISTAKES
- Not sorting the triplets in output
- Including duplicate triplets
- Wrong two-pointer movement
- Not skipping duplicates properly

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n²) - sorting + two pointers
Space Complexity: O(1) - excluding output space

📌 EXAMPLES
Sample Input 1:
6
-1 0 1 2 -1 -4
Sample Output 1:
-1 -1 2
-1 0 1
Explanation: Two triplets sum to zero

Sample Input 2:
3
0 0 0
Sample Output 2:
0 0 0
Explanation: Single triplet of zeros

Sample Input 3:
7
-2 0 1 1 2
Sample Output 3:
-2 0 2
-2 1 1
Explanation: Two valid triplets`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "6\n-1 0 1 2 -1 -4", "-1 -1 2\n-1 0 1"),
        makeCase("2", "3\n0 0 0", "0 0 0"),
      ],
      [
        makeCase("11", "7\n-2 0 1 1 2", "-2 0 2\n-2 1 1"),
        makeCase("12", "4\n-1000 0 1000 1", "-1000 0 1000"),
        makeCase("13", "5\n-4 -1 -1 0 1", "-4 -1 0\n-1 0 1"),
      ]
    ),
  },
  {
    name: "Rotate Array by K",
    slug: "rotate-array",
    tags: ["array", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Rotate an array to the right by k steps. Elements that fall off the end should wrap around to the beginning. This problem teaches array manipulation and modular arithmetic.

📥 INPUT FORMAT
First line: n k (array size and rotation steps)
Second line: n space-separated integers

📤 OUTPUT FORMAT
Array after rotation, space-separated

🔒 CONSTRAINTS
- 1 ≤ n ≤ 10^5
- 0 ≤ k ≤ 10^5

🧠 APPROACH & ALGORITHM
1. Read n, k and the array
2. Handle k >= n using modulo: k = k % n
3. Split array into two parts: last k elements and first n-k elements
4. Combine in rotated order: last k + first n-k
5. Or use reversal algorithm: reverse all, reverse first k, reverse last n-k

⚠️ EDGE CASES TO CONSIDER
- k = 0 (no rotation)
- k = n (full rotation, same as original)
- k > n (use modulo)
- n = 1 (single element)
- Large k values

⛔ COMMON MISTAKES
- Not using modulo for k >= n
- Wrong rotation direction
- Array index errors
- Inefficient approaches for large arrays

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n) - linear operations
Space Complexity: O(n) - storing result

📌 EXAMPLES
Sample Input 1:
5 2
1 2 3 4 5
Sample Output 1: 4 5 1 2 3
Explanation: Rotate right by 2: 4,5 move to front

Sample Input 2:
3 1
1 2 3
Sample Output 2: 3 1 2
Explanation: 3 moves to front

Sample Input 3:
4 4
1 2 3 4
Sample Output 3: 1 2 3 4
Explanation: k % n = 0, no rotation`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5 2\n1 2 3 4 5", "4 5 1 2 3"),
        makeCase("2", "3 1\n1 2 3", "3 1 2"),
      ],
      [
        makeCase("11", "4 4\n1 2 3 4", "1 2 3 4"),
        makeCase("12", "6 0\n1 2 3 4 5 6", "1 2 3 4 5 6"),
        makeCase("13", "5 7\n1 2 3 4 5", "4 5 1 2 3"),
      ]
    ),
  },
  {
    name: "Best Time to Buy and Sell Stock",
    slug: "best-stock-time",
    tags: ["array", "greedy", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Find the maximum profit possible from buying and selling a stock once. You must buy before you sell, and you can only make one transaction. This classic problem demonstrates greedy algorithms and dynamic programming concepts.

📥 INPUT FORMAT
First line: n (number of days)
Second line: n space-separated integers (stock prices)

📤 OUTPUT FORMAT
Maximum profit possible (0 if no profit possible)

🔒 CONSTRAINTS
- 1 ≤ n ≤ 10^5
- 0 ≤ price ≤ 10^4

🧠 APPROACH & ALGORITHM
1. Track minimum price seen so far
2. For each price, calculate profit if sold today
3. Update maximum profit found
4. Update minimum price if current is lower

⚠️ EDGE CASES TO CONSIDER
- Prices only decrease (profit = 0)
- Prices only increase
- Single day (no transaction possible)
- All prices equal
- Maximum price at beginning

⛔ COMMON MISTAKES
- Trying to buy after selling
- Not handling decreasing prices
- Wrong profit calculation
- Multiple transactions instead of one

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n) - single pass
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1:
6
7 1 5 3 6 4
Sample Output 1: 5
Explanation: Buy at 1, sell at 6: profit = 5

Sample Input 2:
5
7 6 4 3 1
Sample Output 2: 0
Explanation: Prices decreasing, no profit

Sample Input 3:
3
1 2 3
Sample Output 3: 2
Explanation: Buy at 1, sell at 3: profit = 2`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "6\n7 1 5 3 6 4", "5"),
        makeCase("2", "5\n7 6 4 3 1", "0"),
      ],
      [
        makeCase("11", "3\n1 2 3", "2"),
        makeCase("12", "2\n2 4", "2"),
        makeCase("13", "4\n3 2 6 5", "4"),
      ]
    ),
  },
  {
    name: "Search in Rotated Sorted Array",
    slug: "search-rotated",
    tags: ["binary-search", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Search for a target value in a rotated sorted array. The array was originally sorted in ascending order but rotated at some unknown pivot point. This problem requires modified binary search techniques.

📥 INPUT FORMAT
First line: target integer
Second line: n (array size)
Third line: n space-separated integers (rotated sorted array)

📤 OUTPUT FORMAT
0-based index of target if found, -1 otherwise

🔒 CONSTRAINTS
- 1 ≤ n ≤ 5000
- -10^9 ≤ arr[i] ≤ 10^9
- All elements are unique

🧠 APPROACH & ALGORITHM
1. Read target, n, and array
2. Use modified binary search
3. At each step, determine which half is sorted
4. Check if target is in the sorted half
5. Search the appropriate half

⚠️ EDGE CASES TO CONSIDER
- Array not rotated (normal sorted)
- Rotated by one position
- Target at pivot point
- Target not in array
- Array size 1

⛔ COMMON MISTAKES
- Using standard binary search
- Wrong pivot detection
- Not handling both halves correctly
- Edge case failures

💡 COMPLEXITY EXPECTATION
Time Complexity: O(log n) - modified binary search
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1:
0
7
4 5 6 7 0 1 2
Sample Output 1: 4
Explanation: Target 0 found at index 4

Sample Input 2:
3
7
4 5 6 7 0 1 2
Sample Output 2: -1
Explanation: 3 not in array

Sample Input 3:
5
7
4 5 6 7 0 1 2
Sample Output 3: 1
Explanation: 5 found at index 1`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "0\n7\n4 5 6 7 0 1 2", "4"),
        makeCase("2", "3\n7\n4 5 6 7 0 1 2", "-1"),
      ],
      [
        makeCase("11", "5\n7\n4 5 6 7 0 1 2", "1"),
        makeCase("12", "1\n3\n3 1", "1"),
        makeCase("13", "13\n5\n13 13 13 13 13", "0"),
      ]
    ),
  },
  {
    name: "Rightmost Different Bit",
    slug: "different-bit",
    tags: ["bit-manipulation", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Find the position of the rightmost (least significant) bit where two numbers differ. This bit manipulation problem uses XOR to identify differing bits and find the lowest set bit position.

📥 INPUT FORMAT
Single line with two space-separated integers a b

📤 OUTPUT FORMAT
1-based position of rightmost differing bit, or -1 if numbers equal

🔒 CONSTRAINTS
- 1 ≤ a, b ≤ 10^9

🧠 APPROACH & ALGORITHM
1. If a == b, return -1
2. Compute XOR: diff = a ^ b
3. Find position of lowest set bit in diff
4. Return position (1-based from right)

⚠️ EDGE CASES TO CONSIDER
- Identical numbers (return -1)
- Numbers differing in LSB
- Numbers differing in MSB
- One number is zero

⛔ COMMON MISTAKES
- Wrong position numbering (0-based vs 1-based)
- Not handling equal numbers
- Wrong bit position calculation

💡 COMPLEXITY EXPECTATION
Time Complexity: O(1) - constant operations
Space Complexity: O(1) - constant space

📌 EXAMPLES
Sample Input 1: 5 2
Sample Output 1: 2
Explanation: 5=101, 2=010, XOR=111, rightmost bit is position 2 (2^1)

Sample Input 2: 5 5
Sample Output 2: -1
Explanation: Numbers equal, no differing bits

Sample Input 3: 1 2
Sample Output 3: 1
Explanation: 1=001, 2=010, XOR=011, rightmost bit is position 1 (2^0)`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5 2", "2"),
        makeCase("2", "5 5", "-1"),
      ],
      [
        makeCase("11", "1 2", "1"),
        makeCase("12", "10 6", "2"),
        makeCase("13", "7 4", "1"),
      ]
    ),
  },
  {
    name: "Substring Frequency Count",
    slug: "substring-count",
    tags: ["string", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Count the number of non-overlapping occurrences of a substring (pattern) within a main string (text). This problem introduces string searching and pattern matching algorithms.

📥 INPUT FORMAT
First line: main string (text)
Second line: substring (pattern)

📤 OUTPUT FORMAT
Integer count of non-overlapping pattern occurrences

🔒 CONSTRAINTS
- 1 ≤ text.length ≤ 10^4
- 1 ≤ pattern.length ≤ 100
- All lowercase English letters

🧠 APPROACH & ALGORITHM
1. Read text and pattern strings
2. Initialize count = 0, position = 0
3. While pattern found in text starting from position:
   - Increment count
   - Update position to after current match
4. Return count

⚠️ EDGE CASES TO CONSIDER
- Pattern longer than text
- Pattern not found (count = 0)
- Pattern appears at end of text
- Overlapping patterns (count non-overlapping)
- Pattern is single character

⛔ COMMON MISTAKES
- Counting overlapping occurrences
- Wrong position updating
- Not handling empty strings (constrained)
- Case sensitivity issues

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n*m) - naive string search
Space Complexity: O(1) - excluding input strings

📌 EXAMPLES
Sample Input 1:
ababa
ab
Sample Output 1: 2
Explanation: 'ab' at positions 0-1 and 2-3

Sample Input 2:
aaaa
aa
Sample Output 2: 2
Explanation: 'aa' at 0-1 and 2-3 (non-overlapping)

Sample Input 3:
hello
l
Sample Output 3: 2
Explanation: 'l' at positions 2 and 3`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "ababa\nab", "2"),
        makeCase("2", "aaaa\naa", "2"),
      ],
      [
        makeCase("11", "hello\nl", "2"),
        makeCase("12", "test\nx", "0"),
        makeCase("13", "aaa\na", "3"),
      ]
    ),
  },
  {
    name: "Word Pattern Matching",
    slug: "word-pattern",
    tags: ["string", "map", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Check if string follows given pattern (1-to-1 mapping).\n\nInput Format:\nFirst line: pattern (letters)\nSecond line: space-separated values\n\nOutput Format:\n'yes' if matches with 1-to-1 mapping, 'no' otherwise\n\nConstraints:\npattern length = number of values\n\nExample:\nInput:\nabba\n1 2 2 1\nOutput:\nyes",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "abba\n1 2 2 1", "yes"),
        makeCase("2", "abb\n1 2 2", "yes"),
      ],
      [
        makeCase("11", "aab\n1 1 2", "no"),
        makeCase("12", "a\n1", "yes"),
        makeCase("13", "abba\n1 2 2 1", "yes"),
      ]
    ),
  },
  {
    name: "Partition Equal Sum Subsets",
    slug: "partition-subset",
    tags: ["dynamic-programming", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Check if array can be partitioned into two subsets with equal sum.\n\nInput Format:\nFirst line: n\nSecond line: n integers\n\nOutput Format:\n'yes' if can partition, 'no' otherwise\n\nConstraints:\n1 <= n <= 200\n1 <= arr[i] <= 100\n\nExample:\nInput:\n4\n1 5 11 5\nOutput:\nyes",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "4\n1 5 11 5", "yes"),
        makeCase("2", "2\n1 2", "no"),
      ],
      [
        makeCase("11", "4\n2 2 1 1", "yes"),
        makeCase("12", "1\n1", "no"),
        makeCase("13", "5\n1 1 1 1 1", "yes"),
      ]
    ),
  },

  // Medium 11-20
  {
    name: "Minimum Coin Change",
    slug: "min-coin-change",
    tags: ["dynamic-programming", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Find the minimum number of coins needed to make a target amount using given coin denominations. Each coin denomination can be used unlimited times. This classic dynamic programming problem demonstrates the coin change algorithm.

📥 INPUT FORMAT
First line: target amount
Second line: n (number of coin types)
Third line: n space-separated coin denominations

📤 OUTPUT FORMAT
Minimum number of coins needed, or -1 if impossible

🔒 CONSTRAINTS
- 1 ≤ amount ≤ 5000
- 1 ≤ n ≤ 100
- 1 ≤ coins[i] ≤ 5000

🧠 APPROACH & ALGORITHM
1. Initialize dp array of size amount+1 with infinity
2. dp[0] = 0 (0 coins for amount 0)
3. For each coin, update dp[j] for j from coin to amount
4. dp[j] = min(dp[j], dp[j - coin] + 1)
5. Return dp[amount] if not infinity, else -1

⚠️ EDGE CASES TO CONSIDER
- Amount = 0 (0 coins)
- Cannot make exact amount
- Single coin type
- Large coins that can't make small amounts

⛔ COMMON MISTAKES
- Not initializing dp correctly
- Wrong iteration order
- Not handling impossible cases
- Integer overflow

💡 COMPLEXITY EXPECTATION
Time Complexity: O(amount × n)
Space Complexity: O(amount)

📌 EXAMPLES
Sample Input 1:
5
3
1 2 5
Sample Output 1: 1
Explanation: One 5-coin makes 5

Sample Input 2:
3
2
2
Sample Output 2: -1
Explanation: Cannot make 3 with only 2's

Sample Input 3:
0
1
1
Sample Output 3: 0
Explanation: 0 amount needs 0 coins`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5\n3\n1 2 5", "1"),
        makeCase("2", "3\n2\n2\n2", "-1"),
      ],
      [
        makeCase("11", "0\n1\n1", "0"),
        makeCase("12", "10\n4\n1 2 5 10", "1"),
        makeCase("13", "4\n3\n1 2 3", "1"),
      ]
    ),
  },
  {
    name: "Longest Increasing Subsequence",
    slug: "lis",
    tags: ["dynamic-programming", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Find the length of the longest strictly increasing subsequence in an array. A subsequence maintains the relative order of elements but doesn't need to be contiguous. This problem showcases dynamic programming and more advanced optimization techniques.

📥 INPUT FORMAT
First line: n (array size)
Second line: n space-separated integers

📤 OUTPUT FORMAT
Length of longest increasing subsequence

🔒 CONSTRAINTS
- 1 ≤ n ≤ 2500
- -10^4 ≤ arr[i] ≤ 10^4

🧠 APPROACH & ALGORITHM
1. Initialize dp array where dp[i] = length of LIS ending at i
2. For each element, check all previous elements
3. If arr[j] < arr[i], dp[i] = max(dp[i], dp[j] + 1)
4. Track global maximum length

⚠️ EDGE CASES TO CONSIDER
- Strictly decreasing array (LIS = 1)
- Strictly increasing array (LIS = n)
- Array with duplicates
- Single element (LIS = 1)

⛔ COMMON MISTAKES
- Not handling strictly increasing requirement
- Wrong DP initialization
- Off-by-one in array indexing
- Not finding global maximum

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n²) - nested loops
Space Complexity: O(n) - dp array

📌 EXAMPLES
Sample Input 1:
8
0 1 0 4 3 2 3 5
Sample Output 1: 4
Explanation: [0,1,3,5] or [0,4,3,5]

Sample Input 2:
3
3 2 1
Sample Output 2: 1
Explanation: Strictly decreasing

Sample Input 3:
5
1 2 3 4 5
Sample Output 3: 5
Explanation: Entire array is increasing`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "8\n0 1 0 4 3 2 3 5", "4"),
        makeCase("2", "3\n3 2 1", "1"),
      ],
      [
        makeCase("11", "5\n1 2 3 4 5", "5"),
        makeCase("12", "1\n7", "1"),
        makeCase("13", "6\n5 4 3 2 1", "1"),
      ]
    ),
  },
  {
    name: "Decode String Pattern",
    slug: "decode-string",
    tags: ["string", "stack", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Decode an encoded string with nested repetition patterns. Numbers followed by [string] indicate the string should be repeated that many times. Supports multiple levels of nesting. This problem demonstrates stack-based parsing of nested structures.

📥 INPUT FORMAT
Single line containing encoded string s

📤 OUTPUT FORMAT
Decoded string after expanding all patterns

🔒 CONSTRAINTS
- 1 ≤ s.length ≤ 40
- Lowercase letters, digits, brackets []
- Pattern: number[string], can be nested

🧠 APPROACH & ALGORITHM
1. Use stack to handle nested patterns
2. Iterate through string character by character
3. When digit encountered, parse full number
4. When '[' encountered, push current state to stack
5. When ']' encountered, pop from stack and repeat
6. Build result string

⚠️ EDGE CASES TO CONSIDER
- No nesting (simple repetition)
- Deep nesting levels
- Multiple digits in number
- Empty strings in brackets

⛔ COMMON MISTAKES
- Wrong stack operations
- Not parsing multi-digit numbers
- Incorrect string building
- Handling nested brackets

💡 COMPLEXITY EXPECTATION
Time Complexity: O(output length)
Space Complexity: O(output length)

📌 EXAMPLES
Sample Input 1: 2[a]3[bc]
Sample Output 1: aabcbcbc
Explanation: 2[a] → aa, 3[bc] → bcbcbc

Sample Input 2: 3[a2[c]]
Sample Output 2: accaccacc
Explanation: 2[c] → cc, then 3[acc] → accaccacc

Sample Input 3: 10[abc]
Sample Output 3: abcabcabcabcabcabcabcabcabcabc
Explanation: abc repeated 10 times`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "2[a]3[bc]", "aabcbcbc"),
        makeCase("2", "3[a2[c]]", "accaccacc"),
      ],
      [
        makeCase("11", "a2[b2[c]]", "abccbcc"),
        makeCase("12", "2[abc]3[cd]", "abcabccdcdcd"),
        makeCase("13", "10[a]", "aaaaaaaaaa"),
      ]
    ),
  },
  {
    name: "Trapping Rain Water",
    slug: "trap-rain",
    tags: ["array", "stack", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Calculate the total units of rainwater that can be trapped between elevation bars of different heights. Water is trapped in the valleys formed by the bars, with the height of trapped water determined by the minimum of the surrounding maximum heights.

📥 INPUT FORMAT
First line: n (number of bars)
Second line: n space-separated bar heights

📤 OUTPUT FORMAT
Total units of water that can be trapped

🔒 CONSTRAINTS
- 0 ≤ n ≤ 3000
- 0 ≤ height[i] ≤ 100

🧠 APPROACH & ALGORITHM
1. For each bar, find maximum height to its left
2. Find maximum height to its right
3. Water trapped at each position = min(left_max, right_max) - height
4. Sum positive values (ignore negative)

⚠️ EDGE CASES TO CONSIDER
- No bars (n=0)
- All bars same height
- Strictly increasing/decreasing
- Single bar
- Bars with zeros

⛔ COMMON MISTAKES
- Not taking minimum of left and right max
- Negative water values
- Wrong boundary handling
- Off-by-one in array access

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n) - three passes
Space Complexity: O(n) - left and right max arrays

📌 EXAMPLES
Sample Input 1:
12
0 1 0 2 1 0 1 3 2 1 2 1
Sample Output 1: 6
Explanation: Water trapped in various positions

Sample Input 2:
4
4 2 0 3
Sample Output 2: 4
Explanation: Water trapped between bars

Sample Input 3:
3
0 1 0
Sample Output 3: 0
Explanation: No space to trap water`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "12\n0 1 0 2 1 0 1 3 2 1 2 1", "6"),
        makeCase("2", "4\n4 2 0 3", "4"),
      ],
      [
        makeCase("11", "3\n0 1 0", "0"),
        makeCase("12", "6\n3 0 0 2 0 4", "10"),
        makeCase("13", "9\n0 1 0 2 1 0 1 3 2 1 2 1", "6"),
      ]
    ),
  },
  {
    name: "Detect Cycle in Linked List",
    slug: "detect-cycle",
    tags: ["linked-list", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Detect whether a linked list contains a cycle using Floyd's cycle detection algorithm (tortoise and hare). A cycle exists if a node can be reached again by following the next pointers. This problem demonstrates efficient cycle detection in linked structures.

📥 INPUT FORMAT
First line: n (number of nodes)
Second line: n node values
Third line: cycle start index (-1 if no cycle)

📤 OUTPUT FORMAT
'yes' if cycle exists, 'no' otherwise

🔒 CONSTRAINTS
- 0 ≤ n ≤ 10^4
- -10^5 ≤ values ≤ 10^5

🧠 APPROACH & ALGORITHM
1. Create linked list from values and cycle index
2. Use two pointers: slow and fast
3. Slow moves one step, fast moves two steps
4. If they meet, cycle exists
5. If fast reaches end, no cycle

⚠️ EDGE CASES TO CONSIDER
- Empty list (no cycle)
- Single node with cycle to itself
- Single node without cycle
- Cycle at beginning
- No cycle

⛔ COMMON MISTAKES
- Wrong pointer movement
- Not handling NULL termination
- Infinite loop detection
- Edge case failures

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n) - linear traversal
Space Complexity: O(1) - constant extra space

📌 EXAMPLES
Sample Input 1:
3
3 2 0
1
Sample Output 1: yes
Explanation: Cycle starts at index 1

Sample Input 2:
3
1 2 3
-1
Sample Output 2: no
Explanation: No cycle

Sample Input 3:
2
0 1
0
Sample Output 3: yes
Explanation: Node 0 points to itself`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3\n3 2 0\n1", "yes"),
        makeCase("2", "3\n1 2 3\n-1", "no"),
      ],
      [
        makeCase("11", "2\n0 1\n0", "yes"),
        makeCase("12", "1\n1\n-1", "no"),
        makeCase("13", "4\n1 2 3 4\n3", "yes"),
      ]
    ),
  },
  {
    name: "Merge K Sorted Lists",
    slug: "merge-k-lists",
    tags: ["heap", "linked-list", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Merge k sorted linked lists into a single sorted linked list. This problem demonstrates efficient merging of multiple sorted sequences using priority queues or divide-and-conquer approaches.

📥 INPUT FORMAT
First line: k (number of lists)
Next k lines: each list as space-separated values

📤 OUTPUT FORMAT
Merged sorted list, space-separated

🔒 CONSTRAINTS
- 0 ≤ k ≤ 100
- Total nodes ≤ 10^4

🧠 APPROACH & ALGORITHM
1. Use priority queue to always get smallest current element
2. Initialize queue with first element from each list
3. While queue not empty:
   - Extract minimum element
   - Add next element from same list to queue
   - Add extracted element to result

⚠️ EDGE CASES TO CONSIDER
- k = 0 (empty result)
- k = 1 (single list)
- Some lists empty
- All lists empty
- Lists of different lengths

⛔ COMMON MISTAKES
- Wrong priority queue usage
- Not handling empty lists
- Incorrect merging order
- Memory management issues

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n log k) - n total elements, log k for heap
Space Complexity: O(k) - heap size

📌 EXAMPLES
Sample Input 1:
3
1 4 5
1 3 4
2 6
Sample Output 1: 1 1 2 3 4 4 5 6
Explanation: Merged all three lists

Sample Input 2:
1
1 2 3
Sample Output 2: 1 2 3
Explanation: Single list unchanged

Sample Input 3:
2
1 3
2 4
Sample Output 3: 1 2 3 4
Explanation: Two lists merged`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3\n1 4 5\n1 3 4\n2 6", "1 1 2 3 4 4 5 6"),
        makeCase("2", "1\n1 2 3", "1 2 3"),
      ],
      [
        makeCase("11", "2\n1 3\n2 4", "1 2 3 4"),
        makeCase("12", "0", ""),
        makeCase("13", "3\n5\n1 10\n3 8", "1 3 5 8 10"),
      ]
    ),
  },
  {
    name: "Serialize/Deserialize BST",
    slug: "serialize-bst",
    tags: ["tree", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description: `🎯 PROBLEM OVERVIEW
Serialize a Binary Search Tree (BST) to a string representation and deserialize it back to the original BST. This problem demonstrates tree traversal and reconstruction, leveraging BST properties for efficient serialization.

📥 INPUT FORMAT
Preorder traversal of BST (space-separated integers)

📤 OUTPUT FORMAT
Preorder traversal of reconstructed BST

🔒 CONSTRAINTS
- 1 to 5000 nodes in BST

🧠 APPROACH & ALGORITHM
1. Serialization: Perform preorder traversal, store values
2. Deserialization: Use preorder array and BST property
3. For each node, left subtree < node < right subtree
4. Use index to track current position in array

⚠️ EDGE CASES TO CONSIDER
- Single node tree
- Complete BST
- Left/right skewed trees
- Maximum size tree

⛔ COMMON MISTAKES
- Wrong traversal order
- Not using BST properties
- Index management errors
- Tree reconstruction logic

💡 COMPLEXITY EXPECTATION
Time Complexity: O(n) - linear operations
Space Complexity: O(n) - storing serialization

📌 EXAMPLES
Sample Input 1: 5 3 2 4 6
Sample Output 1: 5 3 2 4 6
Explanation: Valid BST preorder traversal

Sample Input 2: 1
Sample Output 2: 1
Explanation: Single node

Sample Input 3: 2 1 3
Sample Output 3: 2 1 3
Explanation: Complete small BST`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5 3 2 4 6", "5 3 2 4 6"),
        makeCase("2", "1", "1"),
      ],
      [
        makeCase("11", "2 1 3", "2 1 3"),
        makeCase("12", "10 5 15 3 7 12 20", "10 5 15 3 7 12 20"),
        makeCase("13", "1 2 3", "1 2 3"),
      ]
    ),
  },
  {
    name: "Word Break Problem",
    slug: "word-break",
    tags: ["dynamic-programming", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given a string s and a dictionary of words, determine if s can be segmented into a space-separated sequence of one or more dictionary words.\n\nThis problem uses dynamic programming to check if the string can be broken down into valid words from the dictionary.\n\nInput Format:\nThe first line contains the string s to check.\nThe second line contains an integer n, the number of words in the dictionary.\nThe next n lines each contain one dictionary word.\n\nOutput Format:\nPrint 'yes' if the string can be segmented, 'no' otherwise.\n\nConstraints:\n- 1 ≤ s.length ≤ 300\n- 1 ≤ n ≤ 100\n- All words consist of lowercase English letters\n\nSample Input 1:\nleetcode\n3\nleet\ncode\nle\n\nSample Output 1:\nyes\n\nExplanation:\n'leetcode' can be segmented as 'leet code' or 'le et code', etc.\n\nSample Input 2:\ncatsandog\n4\ncat\ncats\nand\nsand\ndog\n\nSample Output 2:\nno\n\nExplanation:\nCannot segment 'catsandog' with the given words.\n\nNote:\n- Use DP: dp[i] = true if s[0..i-1] can be segmented\n- For each i, check if any word matches s[j..i-1] and dp[j] is true\n- Time: O(n * m) where n=len(s), m=avg word length\n- Space: O(n)",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "leetcode\n3\nleet\ncode\nle", "yes"),
        makeCase("2", "catsandog\n4\ncat\ncats\nand\nsand\ndog", "no"),
      ],
      [
        makeCase("11", "a\n1\na", "yes"),
        makeCase("12", "applepenapple\n3\napple\npen\nap", "yes"),
        makeCase("13", "catsandcatsdog\n3\ncat\ncats\nand\nsand\ndog", "no"),
      ]
    ),
  },
  {
    name: "Path Sum in Tree",
    slug: "path-sum",
    tags: ["tree", "dfs", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given a binary tree and a target sum, determine if the tree has a root-to-leaf path such that adding up all the values along the path equals the given sum.\n\nA leaf is a node with no children.\n\nInput Format:\nThe first line contains the target sum (integer).\nThe second line contains the tree in level-order traversal, space-separated, with 'null' for missing nodes.\n\nOutput Format:\nPrint 'yes' if such a path exists, 'no' otherwise.\n\nConstraints:\n- Tree has up to 5000 nodes\n- Node values are integers\n\nSample Input 1:\n22\n5 4 8 11 null 13 4 7 2 null 1\n\nSample Output 1:\nyes\n\nExplanation:\nPath 5->4->11->2 sums to 22.\n\nSample Input 2:\n13\n5 4 8\n\nSample Output 2:\nno\n\nExplanation:\nNo path sums to 13.\n\nNote:\n- Use DFS or recursion to traverse paths.\n- Subtract current node value from remaining sum.\n- Check if at leaf and sum == 0.\n- Handle null nodes in input parsing.\n- Time: O(n), Space: O(h) for recursion stack.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "22\n5 4 8 11 null 13 4 7 2 null 1", "yes"),
        makeCase("2", "13\n5 4 8", "no"),
      ],
      [
        makeCase("11", "0\n0", "yes"),
        makeCase("12", "1\n1", "yes"),
        makeCase("13", "5\n2 3 null 4 5", "yes"),
      ]
    ),
  },
  {
    name: "Merge Intervals",
    slug: "merge-intervals",
    tags: ["array", "sorting", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given a collection of intervals, merge all overlapping intervals.\n\nAn interval is represented as [start, end]. Merge intervals that overlap or touch.\n\nInput Format:\nThe first line contains an integer n (1 ≤ n ≤ 10^4), the number of intervals.\nThe next n lines each contain two integers start and end for each interval.\n\nOutput Format:\nPrint the merged intervals, one per line, with start and end space-separated, sorted by start time.\n\nConstraints:\n- 1 ≤ n ≤ 10^4\n- -10^4 ≤ start ≤ end ≤ 10^4\n\nSample Input 1:\n5\n1 3\n2 6\n8 10\n15 18\n4 7\n\nSample Output 1:\n1 6\n8 10\n15 18\n\nExplanation:\n[1,3] and [2,6] overlap, merge to [1,6]; [4,7] overlaps with [1,6], still [1,6].\n\nSample Input 2:\n1\n1 5\n\nSample Output 2:\n1 5\n\nExplanation:\nSingle interval, no merge needed.\n\nNote:\n- Sort intervals by start time.\n- Iterate and merge if current.start <= previous.end.\n- Update end to max(end1, end2).\n- Time: O(n log n) for sort, Space: O(n)\n- Handle non-overlapping intervals.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5\n1 3\n2 6\n8 10\n15 18\n4 7", "1 6\n8 10\n15 18"),
        makeCase("2", "1\n1 5", "1 5"),
      ],
      [
        makeCase("11", "2\n1 4\n4 5", "1 5"),
        makeCase("12", "3\n1 2\n3 4\n5 6", "1 2\n3 4\n5 6"),
        makeCase("13", "4\n1 5\n2 3\n4 6\n0 7", "0 7"),
      ]
    ),
  },

  // Medium 21-30
  {
    name: "Letter and Digit Phone Combinations",
    slug: "phone-letters",
    tags: ["string", "backtracking", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Generate all possible letter combinations from phone digit string.\n\nInput Format:\nDigit string (2-4 digits, 0-9, no 0 or 1)\n\nOutput Format:\nAll combinations (space-separated)\n\nConstraints:\n0 <= digits.length <= 4\nNo 0 or 1 in input\n\nExample:\nInput:\n23\nOutput:\nad ae af bd be bf cd ce cf",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "23", "ad ae af bd be bf cd ce cf"),
        makeCase("2", "234", "adg adh adi aeg aeh aei afg afh afi bdg bdh bdi beg beh bei bfg bfh bfi cdg cdh cdi ceg ceh cei cfg cfh cfi"),
      ],
      [
        makeCase("11", "2", "a b c"),
        makeCase("12", "234", "adg adh adi aeg aeh aei afg afh afi bdg bdh bdi beg beh bei bfg bfh bfi cdg cdh cdi ceg ceh cei cfg cfh cfi"),
        makeCase("13", "6", "m n o"),
      ]
    ),
  },
  {
    name: "Valid Sudoku Checker",
    slug: "sudoku-valid",
    tags: ["array", "matrix", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Check if 9x9 Sudoku board is valid (no duplicate digits in rows/columns/3x3 boxes).\n\nInput Format:\n9 lines of 9 space-separated chars (digit 1-9 or '.')\n\nOutput Format:\n'yes' if valid, 'no' otherwise\n\nConstraints:\nOnly validates, doesn't require completed board\n\nExample:\nInput:\n(9x9 grid)\nOutput:\nyes",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "", "yes"),
        makeCase("2", "", "no"),
      ],
      [
        makeCase("11", "", "yes"),
        makeCase("12", "", "no"),
        makeCase("13", "", "yes"),
      ]
    ),
  },
  {
    name: "Add Operators Between Digits",
    slug: "expression-operators",
    tags: ["backtracking", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given a string of digits and a target value, add binary operators (+, -, *) between the digits so that the expression evaluates to the target. Return all possible expressions.\n\nThis problem uses backtracking to try all possible ways to insert operators and evaluate the expressions.\n\nInput Format:\nThe first line contains the string of digits (no leading zeros except for '0').\nThe second line contains the target integer value.\n\nOutput Format:\nPrint all valid expressions that evaluate to the target, one per line. If none, print nothing.\n\nConstraints:\n- 1 ≤ digits.length ≤ 20\n- -2^31 ≤ target ≤ 2^31 - 1\n- No leading zeros in numbers (except single '0')\n\nSample Input 1:\n123\n6\n\nSample Output 1:\n1+2+3\n1*2*3\n\nExplanation:\n1+2+3 = 6, 1*2*3 = 6.\n\nSample Input 2:\n232\n8\n\nSample Output 2:\n2*3+2\n2+3*2\n\nExplanation:\n2*3+2 = 8, 2+3*2 = 8.\n\nNote:\n- Use backtracking to try operators between digits.\n- Keep track of current value and previous operand for multiplication precedence.\n- Handle large numbers carefully.\n- Time: exponential, but constrained by length.\n- Output in any order.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "123\n6", "1+2+3\n1*2*3"),
        makeCase("2", "232\n8", "2*3+2\n2+3*2"),
      ],
      [
        makeCase("11", "0\n0", "0"),
        makeCase("12", "12\n3", "1+2\n1*2"),
        makeCase("13", "2020\n0", "2-0-2*0\n2*0-2+0"),
      ]
    ),
  },
  {
    name: "Binary Tree Level-Order Traversal",
    slug: "level-order-tree",
    tags: ["tree", "bfs", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given a binary tree, return the level-order traversal of its nodes' values (breadth-first search).\n\nLevel-order traversal visits nodes level by level, from left to right.\n\nInput Format:\nA single line containing the tree in level-order, space-separated, with 'null' for missing nodes.\n\nOutput Format:\nPrint the values level by level, with levels separated by semicolons and spaces within levels.\n\nConstraints:\n- Tree has 1 to 1000 nodes\n- Node values are integers\n\nSample Input 1:\n3 9 20 null null 15 7\n\nSample Output 1:\n3 ; 9 20 ; 15 7\n\nExplanation:\nLevel 0: 3\nLevel 1: 9, 20\nLevel 2: 15, 7\n\nSample Input 2:\n1\n\nSample Output 2:\n1\n\nExplanation:\nSingle node tree.\n\nNote:\n- Use a queue for BFS.\n- Process nodes level by level.\n- Use 'null' to represent missing children.\n- Time: O(n), Space: O(n)\n- Output format: space-separated within level, ; between levels.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3 9 20 null null 15 7", "3 ; 9 20 ; 15 7"),
        makeCase("2", "1", "1"),
      ],
      [
        makeCase("11", "1 2 3", "1 ; 2 3"),
        makeCase("12", "1 null 2", "1 ; 2"),
        makeCase("13", "1 2 3 4 5 6 7", "1 ; 2 3 ; 4 5 6 7"),
      ]
    ),
  },
  {
    name: "Course Schedule Feasibility",
    slug: "course-schedule",
    tags: ["graph", "topological-sort", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "There are a total of numCourses courses you have to take, labeled from 0 to numCourses-1. Some courses may have prerequisites. Determine if it is possible to finish all courses (no circular dependencies).\n\nThis is a graph problem where courses are nodes and prerequisites are directed edges. We need to check for cycles.\n\nInput Format:\nThe first line contains an integer numCourses.\nThe subsequent lines contain pairs [course, prerequisite], meaning prerequisite must be taken before course.\n\nOutput Format:\nPrint 'yes' if all courses can be finished, 'no' if there's a cycle.\n\nConstraints:\n- 1 ≤ numCourses ≤ 2000\n- 0 ≤ course, prerequisite < numCourses\n\nSample Input 1:\n2\n1 0\n\nSample Output 1:\nyes\n\nExplanation:\nCourse 0 has no prerequisite, course 1 requires 0. No cycle.\n\nSample Input 2:\n2\n1 0\n0 1\n\nSample Output 2:\nno\n\nExplanation:\nCycle: 0 requires 1, 1 requires 0.\n\nNote:\n- Build adjacency list for graph.\n- Use topological sort or DFS to detect cycles.\n- If all nodes can be visited without cycle, possible.\n- Time: O(V + E), Space: O(V + E)",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "2\n1 0", "yes"),
        makeCase("2", "2\n1 0\n0 1", "no"),
      ],
      [
        makeCase("11", "1", "yes"),
        makeCase("12", "3\n1 0\n2 1", "yes"),
        makeCase("13", "3\n0 1\n1 2\n2 0", "no"),
      ]
    ),
  },
  {
    name: "LRU Cache Implementation",
    slug: "lru-cache",
    tags: ["design", "hash-map", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Design and implement an LRU (Least Recently Used) cache that supports get and put operations.\n\nThe cache should have a fixed capacity. When the cache is full and a new item is added, the least recently used item should be evicted.\n\nInput Format:\nThe first line contains the cache capacity.\nThe subsequent lines contain operations: either 'get key' or 'put key value'.\n\nOutput Format:\nFor each get operation, print the value if present, or -1 if not. Put operations produce no output.\n\nConstraints:\n- 1 ≤ capacity ≤ 5000\n- At most 5000 operations\n- 0 ≤ key ≤ 10^4\n- 0 ≤ value ≤ 10^5\n\nSample Input 1:\n2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\n\nSample Output 1:\n1\n-1\n\nExplanation:\nput 1, put 2; get 1 returns 1; put 3 evicts 2; get 2 returns -1.\n\nSample Input 2:\n1\nput 1 1\nget 1\nput 2 2\nget 2\n\nSample Output 2:\n1\n2\n\nExplanation:\nput 1; get 1 returns 1; put 2 evicts 1; get 2 returns 2.\n\nNote:\n- Use a hash map for O(1) access and a doubly linked list for order.\n- On get/put, move accessed item to front.\n- On put when full, remove from back.\n- Time: O(1) per operation.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2", "1\n-1"),
        makeCase("2", "1\nput 1 1\nget 1", "1"),
      ],
      [
        makeCase("11", "2\nget 2\nput 2 6\nget 1\nput 1 5", "-1\n-1"),
        makeCase("12", "3\nput 1 1\nput 2 2\nput 3 3\nget 1\nput 4 4\nget 2", "1\n-1"),
        makeCase("13", "2\nput 1 1\nget 1\nput 2 2\nget 2", "1\n2"),
      ]
    ),
  },
  {
    name: "Remove Element In-Place",
    slug: "remove-element",
    tags: ["array", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given an integer array and a value val, remove all instances of that value in-place and return the new length of the array.\n\nThe order of elements can be changed. It doesn't matter what you leave beyond the new length.\n\nInput Format:\nThe first line contains an integer n, the size of the array.\nThe second line contains n space-separated integers, the array elements.\nThe third line contains the integer val to remove.\n\nOutput Format:\nPrint a single integer, the number of elements not equal to val (the new length).\n\nConstraints:\n- 0 ≤ n ≤ 100\n- 0 ≤ arr[i] ≤ 50\n- 0 ≤ val ≤ 50\n\nSample Input 1:\n4\n0 1 2 2\n2\n\nSample Output 1:\n2\n\nExplanation:\nRemove all 2's, remaining elements: 0, 1. Length 2.\n\nSample Input 2:\n3\n3 3 3\n3\n\nSample Output 2:\n0\n\nExplanation:\nRemove all 3's, array becomes empty. Length 0.\n\nNote:\n- Modify array in-place.\n- Use two pointers: one for reading, one for writing.\n- Skip elements equal to val.\n- Return count of non-val elements.\n- Time: O(n), Space: O(1)",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "4\n0 1 2 2\n2", "2"),
        makeCase("2", "3\n3 3 3\n3", "0"),
      ],
      [
        makeCase("11", "2\n1 1\n1", "0"),
        makeCase("12", "5\n0 1 2 2 3\n2", "3"),
        makeCase("13", "1\n4\n5", "1"),
      ]
    ),
  },
  {
    name: "Flatten Nested List Iterator",
    slug: "flatten-nested",
    tags: ["stack", "design", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Flatten a nested list iterator.\n\nInput Format:\nNested list structure\n\nOutput Format:\nFlattened integers in order\n\nConstraints:\nNesting level <= 5\nList size <= 1000\n\nExample:\nInput:\n[[1,1],2,[1,1]]\nOutput:\n1 1 2 1 1",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "[[1,1],2,[1,1]]", "1 1 2 1 1"),
        makeCase("2", "[1,[4,[6]]]", "1 4 6"),
      ],
      [
        makeCase("11", "[[[]]]", ""),
        makeCase("12", "[1]", "1"),
        makeCase("13", "[1,[2,3]]", "1 2 3"),
      ]
    ),
  },
  {
    name: "Kth Smallest Element in BST",
    slug: "kth-smallest-bst",
    tags: ["tree", "bst", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Find the kth smallest element in a BST.\n\nInput Format:\nFirst line: level-order tree\nSecond line: k\n\nOutput Format:\nKth smallest value\n\nConstraints:\nn <= 10^4\n1 <= k <= n\n\nExample:\nInput:\n3 1 4 null 2\n1\nOutput:\n1",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3 1 4 null 2\n1", "1"),
        makeCase("2", "3 1 4 null 2\n4", "4"),
      ],
      [
        makeCase("11", "5 3 6 2 4 null 7\n1", "2"),
        makeCase("12", "1\n1", "1"),
        makeCase("13", "5 3 6 2 4 null 7\n3", "3"),
      ]
    ),
  },

  // Medium 31-40
  {
    name: "Basic Calculator Implementation",
    slug: "calc-parser",
    tags: ["stack", "string", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given a string representing a mathematical expression with +, -, *, / and parentheses, evaluate the expression and return the integer result.\n\nThis problem involves parsing and evaluating expressions with operator precedence and parentheses.\n\nInput Format:\nA single line containing the mathematical expression (no spaces).\n\nOutput Format:\nPrint the integer result of evaluating the expression.\n\nConstraints:\n- Expression length ≤ 100\n- Contains digits, +, -, *, /, (, )\n- Valid expression, no division by zero\n\nSample Input 1:\n2+3*4\n\nSample Output 1:\n14\n\nExplanation:\n2 + (3 * 4) = 2 + 12 = 14\n\nSample Input 2:\n2*3+4\n\nSample Output 2:\n10\n\nExplanation:\n(2 * 3) + 4 = 6 + 4 = 10\n\nSample Input 3:\n(2+3)*4\n\nSample Output 3:\n20\n\nExplanation:\n(2 + 3) * 4 = 5 * 4 = 20\n\nNote:\n- Handle operator precedence: * / before + -\n- Use stacks for numbers and operators.\n- Process parentheses by evaluating subexpressions.\n- Integer division truncates towards zero.\n- Time: O(n), Space: O(n)",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "2+3*4", "14"),
        makeCase("2", "2*3+4", "10"),
      ],
      [
        makeCase("11", "(2+3)*4", "20"),
        makeCase("12", "10", "10"),
        makeCase("13", "1+1", "2"),
      ]
    ),
  },
  {
    name: "Majority Element Finder",
    slug: "majority-element",
    tags: ["array", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given an array of integers, find the majority element that appears more than n/2 times.\n\nA majority element always exists in the array.\n\nInput Format:\nThe first line contains an integer n (1 ≤ n ≤ 5000), the size of the array.\nThe second line contains n space-separated integers.\n\nOutput Format:\nPrint the majority element.\n\nConstraints:\n- 1 ≤ n ≤ 5000\n- Majority element is guaranteed to exist\n- Elements are integers\n\nSample Input 1:\n3\n3 2 3\n\nSample Output 1:\n3\n\nExplanation:\n3 appears twice (> 3/2 = 1.5), so 3.\n\nSample Input 2:\n5\n1 1 1 2 3\n\nSample Output 2:\n1\n\nExplanation:\n1 appears three times (> 5/2 = 2.5).\n\nNote:\n- Use Boyer-Moore Voting Algorithm for O(n) time, O(1) space.\n- Or use hash map to count frequencies.\n- Since majority exists, the candidate from voting is correct.\n- Time: O(n), Space: O(1) for voting.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3\n3 2 3", "3"),
        makeCase("2", "5\n1 1 1 2 3", "1"),
      ],
      [
        makeCase("11", "1\n1", "1"),
        makeCase("12", "7\n2 2 1 1 1 2 2", "2"),
        makeCase("13", "5\n5 5 5 1 1", "5"),
      ]
    ),
  },
  {
    name: "Inorder Successor in BST",
    slug: "inorder-successor",
    tags: ["tree", "bst", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given a binary search tree (BST) and a node value, find the inorder successor of that node.\n\nThe inorder successor is the next node in inorder traversal. If no successor exists, return -1.\n\nInput Format:\nThe first line contains the BST in level-order traversal, space-separated, with 'null' for missing nodes.\nThe second line contains the node value to find successor for.\n\nOutput Format:\nPrint the inorder successor value, or -1 if none exists.\n\nConstraints:\n- The node value exists in the tree\n- Tree nodes have unique values\n\nSample Input 1:\n2 1 3\n1\n\nSample Output 1:\n2\n\nExplanation:\nInorder: 1, 2, 3. Successor of 1 is 2.\n\nSample Input 2:\n2 1 3\n3\n\nSample Output 2:\n-1\n\nExplanation:\n3 is the last node, no successor.\n\nNote:\n- In BST, successor is smallest node > target.\n- If node has right subtree, successor is min in right.\n- Else, go up to find first ancestor where node is in left subtree.\n- Time: O(h), Space: O(h) for recursion.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "2 1 3\n1", "2"),
        makeCase("2", "2 1 3\n3", "-1"),
      ],
      [
        makeCase("11", "5 3 6 2 4 null 7\n4", "5"),
        makeCase("12", "5 3 6 2 4 null 7\n6", "7"),
        makeCase("13", "1\n1", "-1"),
      ]
    ),
  },
  {
    name: "Meeting Rooms Scheduler",
    slug: "meeting-rooms",
    tags: ["interval", "sorting", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given an array of meeting time intervals, determine if a person can attend all meetings without conflicts.\n\nA person can attend all meetings if no two meetings overlap.\n\nInput Format:\nThe first line contains an integer n (0 ≤ n ≤ 100), the number of meetings.\nThe next n lines each contain two integers start and end for each meeting interval.\n\nOutput Format:\nPrint 'yes' if the person can attend all meetings, 'no' otherwise.\n\nConstraints:\n- 0 ≤ n ≤ 100\n- 0 ≤ start < end ≤ 10^6\n\nSample Input 1:\n2\n0 30\n5 10\n\nSample Output 1:\nno\n\nExplanation:\nMeetings [0,30] and [5,10] overlap.\n\nSample Input 2:\n2\n5 8\n9 15\n\nSample Output 2:\nyes\n\nExplanation:\nNo overlap between [5,8] and [9,15].\n\nSample Input 3:\n0\n\nSample Output 3:\nyes\n\nExplanation:\nNo meetings, can attend all.\n\nNote:\n- Sort intervals by start time.\n- Check if any interval starts before previous ends.\n- If intervals[i].start < intervals[i-1].end, overlap.\n- Time: O(n log n) for sort, Space: O(n)",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "2\n0 30\n5 10", "no"),
        makeCase("2", "2\n5 8\n9 15", "yes"),
      ],
      [
        makeCase("11", "0", "yes"),
        makeCase("12", "3\n0 5\n5 10\n10 15", "yes"),
        makeCase("13", "2\n1 5\n3 7", "no"),
      ]
    ),
  },
  {
    name: "Jump Game Reachability",
    slug: "jump-game",
    tags: ["greedy", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given an array of non-negative integers, where each element represents the maximum jump length from that position, determine if you can reach the last index.\n\nYou start from index 0, and can jump up to arr[i] steps forward.\n\nInput Format:\nThe first line contains an integer n (1 ≤ n ≤ 10^4), the size of the array.\nThe second line contains n space-separated non-negative integers.\n\nOutput Format:\nPrint 'yes' if you can reach the last index, 'no' otherwise.\n\nConstraints:\n- 1 ≤ n ≤ 10^4\n- 0 ≤ arr[i] ≤ 100\n\nSample Input 1:\n5\n2 3 1 1 4\n\nSample Output 1:\nyes\n\nExplanation:\nJump 1 step to index 1 (3), then 3 steps to index 4.\n\nSample Input 2:\n5\n3 2 1 0 4\n\nSample Output 2:\nno\n\nExplanation:\nCannot jump over the 0 at index 3.\n\nNote:\n- Use greedy: keep track of farthest reachable index.\n- Update farthest = max(farthest, i + arr[i])\n- If i > farthest, cannot reach further.\n- Time: O(n), Space: O(1)",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "5\n2 3 1 1 4", "yes"),
        makeCase("2", "5\n3 2 1 0 4", "no"),
      ],
      [
        makeCase("11", "2\n2 0", "yes"),
        makeCase("12", "1\n0", "yes"),
        makeCase("13", "3\n0 2 3", "no"),
      ]
    ),
  },
  {
    name: "Minimum Path Sum in Grid",
    slug: "min-path-grid",
    tags: ["dynamic-programming", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Find path from top-left to bottom-right with minimum sum.\n\nInput Format:\nFirst line: r c\nNext r lines: grid values\n\nOutput Format:\nMinimum path sum\n\nConstraints:\nm, n <= 200\nAll values positive\n\nExample:\nInput:\n3 3\n1 3 1\n1 5 1\n4 2 1\nOutput:\n7",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3 3\n1 3 1\n1 5 1\n4 2 1", "7"),
        makeCase("2", "1 3\n1 1 1", "3"),
      ],
      [
        makeCase("11", "2 2\n1 3\n2 1", "4"),
        makeCase("12", "1 1\n1", "1"),
        makeCase("13", "2 3\n1 2 3\n4 5 6", "12"),
      ]
    ),
  },
  {
    name: "Unique Path Counter",
    slug: "unique-paths",
    tags: ["dynamic-programming", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Count unique paths from top-left to bottom-right (only right/down moves).\n\nInput Format:\nTwo space-separated integers: m n (rows, cols)\n\nOutput Format:\nNumber of unique paths\n\nConstraints:\n1 <= m, n <= 100\n\nExample:\nInput:\n3 7\nOutput:\n28",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3 7", "28"),
        makeCase("2", "3 2", "3"),
      ],
      [
        makeCase("11", "1 1", "1"),
        makeCase("12", "2 2", "2"),
        makeCase("13", "10 10", "48620"),
      ]
    ),
  },
  {
    name: "Isomorphic Strings",
    slug: "isomorphic-strings",
    tags: ["hash-map", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Check if two strings are isomorphic (1-to-1 char mapping).\n\nInput Format:\nFirst line: string s\nSecond line: string t\n\nOutput Format:\n'yes' if isomorphic, 'no' otherwise\n\nConstraints:\n1 <= s.length, t.length <= 5*10^4\n\nExample:\nInput:\negg\nfoo\nOutput:\nno",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "egg\nfoo", "no"),
        makeCase("2", "badc\nbaba", "no"),
      ],
      [
        makeCase("11", "badc\nbaba", "no"),
        makeCase("12", "paper\ntitle", "yes"),
        makeCase("13", "ab\naa", "no"),
      ]
    ),
  },
];

const extraMediumProblems = [
  {
    name: "Word Search in Grid",
    slug: "word-search-grid",
    tags: ["matrix", "dfs", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Find if a given word exists in a 2D grid by moving horizontally or vertically.\n\nInput Format:\nFirst line: r c\nNext r lines: strings of length c\nNext line: word to find\n\nOutput Format:\nyes or no\n\nConstraints:\n1 <= r, c <= 50\n\nExample:\nInput:\n3 4\nABCE\nSFCS\nADEE\nABCCED\nOutput:\nyes",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3 4\nABCE\nSFCS\nADEE\nABCCED", "yes"),
        makeCase("2", "3 4\nABCE\nSFCS\nADEE\nSEE", "yes"),
      ],
      [
        makeCase("11", "3 4\nABCE\nSFCS\nADEE\nABCB", "no"),
        makeCase("12", "2 2\nAA\nAA\nAAAA", "yes"),
        makeCase("13", "2 2\nAB\nCD\nACB", "no"),
      ]
    ),
  },
  {
    name: "Decode Ways",
    slug: "decode-ways",
    tags: ["dp", "string", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "A message containing letters from A-Z can be encoded into numbers using the mapping A=1, B=2, ..., Z=26. Given a string of digits, determine the total number of ways to decode it.\n\nThis is a dynamic programming problem where we count the number of valid decodings.\n\nInput Format:\nA single line containing the string s of digits.\n\nOutput Format:\nPrint the number of ways to decode the string.\n\nConstraints:\n- 1 ≤ s.length ≤ 100\n- s consists only of digits '0'-'9'\n\nSample Input 1:\n226\n\nSample Output 1:\n3\n\nExplanation:\n226 can be decoded as:\n- 2,2,6 -> B,B,F\n- 22,6 -> V,F\n- 2,26 -> B,Z\n\nSample Input 2:\n12\n\nSample Output 2:\n2\n\nExplanation:\n12 as 1,2 -> A,B or 12 -> L\n\nNote:\n- Use DP: dp[i] = ways to decode first i digits\n- dp[0] = 1\n- For each i, add dp[i-1] if s[i-1] != '0'\n- Add dp[i-2] if last two digits form valid number 10-26\n- Time: O(n), Space: O(n)",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "226", "3"),
        makeCase("2", "12", "2"),
      ],
      [
        makeCase("11", "10", "1"),
        makeCase("12", "27", "1"),
        makeCase("13", "101", "1"),
      ]
    ),
  },
  {
    name: "Unique Substring Count",
    slug: "unique-substring-count",
    tags: ["string", "hashing", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Given a string, count the number of distinct substrings that can be formed from it.\n\nA substring is a contiguous sequence of characters within the string.\n\nInput Format:\nA single line containing the string s.\n\nOutput Format:\nPrint the number of unique substrings.\n\nConstraints:\n- 1 ≤ s.length ≤ 100\n- s consists of lowercase English letters\n\nSample Input 1:\naba\n\nSample Output 1:\n5\n\nExplanation:\nSubstrings: a, b, a, ab, ba, aba. Unique: a, b, ab, ba, aba (5).\n\nSample Input 2:\naaa\n\nSample Output 2:\n3\n\nExplanation:\nSubstrings: a, a, a, aa, aa, aaa. Unique: a, aa, aaa (3).\n\nNote:\n- Total substrings: n*(n+1)/2\n- But many duplicates.\n- Use a set to store all unique substrings.\n- Or use suffix array/trie for efficiency.\n- Time: O(n²) for small n, Space: O(n²)",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "aba", "5"),
        makeCase("2", "aaa", "3"),
      ],
      [
        makeCase("11", "abcd", "10"),
        makeCase("12", "ababa", "9"),
        makeCase("13", "abcab", "11"),
      ]
    ),
  },
];

extraMediumProblems.forEach((p) => problems.push(p));

for (let i = 1; i <= 30; i++) {
  problems.push({
    name: `Hard Challenge ${i}: Algorithmic Intensive`,
    slug: `hard-challenge-${i}`,
    tags: ["hard", i % 2 === 0 ? "graph" : "dp", "optimization"],
    difficulty: "hard",
    is_public: true,
    created_by: adminId,
    description:
      `An original hard challenge number ${i}. Given an integer list, compute a complex metric requiring optimized algorithms.\n\nInput Format:\nFirst line: n\nSecond line: n space-separated integers\n\nOutput Format:\nA single integer with the computed metric.\n\nConstraints:\n1 <= n <= 100000`,
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "3\n1 2 3", "6"),
        makeCase("2", "4\n1 2 3 4", "10"),
      ],
      [
        makeCase("11", "5\n1 1 1 1 1", "5"),
        makeCase("12", "3\n100 200 300", "600"),
        makeCase("13", "1\n42", "42"),
      ]
    ),
  });
}

const problemInsertResult = targetDb.problems.insertMany(problems);
const insertedProblemIds = Object.values(problemInsertResult.insertedIds).map((id) =>
  String(id)
);

const slugToId = {};
targetDb.problems
  .find({}, { slug: 1 })
  .toArray()
  .forEach((p) => {
    slugToId[p.slug] = String(p._id);
  });

print("[Seed] " + problems.length + " problems inserted successfully.");

const now = new Date();
const liveStart = new Date(now.getTime() - 30 * 60 * 1000);
const liveEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000);
const upcomingStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
const upcomingEnd = new Date(upcomingStart.getTime() + 3 * 60 * 60 * 1000);
const endedStart = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
const endedEnd = new Date(endedStart.getTime() + 2 * 60 * 60 * 1000);
const endedStart2 = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
const endedEnd2 = new Date(endedStart2.getTime() + 2 * 60 * 60 * 1000);

const contests = [
  {
    name: "March Challenge Live 2026",
    slug: "march-challenge-live-2026",
    description:
      "Live rated contest focused on array, string, and stack fundamentals. Tie-break by earliest accepted submission.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["sum-of-two-numbers"],
      slugToId["two-sum-return-indices"],
      slugToId["valid-parentheses"],
      slugToId["maximum-subarray-sum"],
    ],
    start_time: liveStart,
    end_time: liveEnd,
    duration: liveEnd.getTime() - liveStart.getTime(),
    support_end_time: new Date(liveEnd.getTime() + 24 * 60 * 60 * 1000),
  },
  {
    name: "April Sprint 2026",
    slug: "april-sprint-2026",
    description:
      "Fast-paced 3-hour sprint with implementation-heavy problems and strict runtime constraints.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["binary-search-first-occurrence"],
      slugToId["longest-substring-without-repeating"],
      slugToId["merge-sorted-arrays"],
      slugToId["rotate-array"],
    ],
    start_time: upcomingStart,
    end_time: upcomingEnd,
    duration: upcomingEnd.getTime() - upcomingStart.getTime(),
    support_end_time: new Date(upcomingEnd.getTime() + 24 * 60 * 60 * 1000),
  },
  {
    name: "May Intermediate Sprint",
    slug: "may-intermediate-sprint",
    description:
      "Intermediate level contest with focus on hashing, sorting, and two-pointer techniques.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["count-vowels"],
      slugToId["reverse-number"],
      slugToId["container-water"],
      slugToId["best-stock-time"],
    ],
    start_time: endedStart2,
    end_time: endedEnd2,
    duration: endedEnd2.getTime() - endedStart2.getTime(),
    support_end_time: new Date(endedEnd2.getTime() + 24 * 60 * 60 * 1000),
  },
  {
    name: "Bitwise Operators Mastery",
    slug: "bitwise-mastery",
    description:
      "Contest emphasizing bit manipulation, binary operations, and optimization.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["is-even"],
      slugToId["different-bit"],
      slugToId["power-of-number"],
      slugToId["perfect-square"],
    ],
    start_time: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    end_time: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    duration: 2 * 60 * 60 * 1000,
    support_end_time: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    name: "String Processing Challenge",
    slug: "string-processing",
    description:
      "Deep dive into string manipulation, pattern matching, and text processing.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["count-vowels"],
      slugToId["palindrome-string"],
      slugToId["substring-count"],
      slugToId["word-break"],
    ],
    start_time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    end_time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    duration: 3 * 60 * 60 * 1000,
    support_end_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Graph Algorithms Marathon",
    slug: "graph-algorithms",
    description:
      "Extended contest featuring BFS, DFS, topological sort, and shortest paths.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["number-of-islands-grid"],
      slugToId["detect-cycle"],
      slugToId["course-schedule"],
      slugToId["level-order-tree"],
    ],
    start_time: upcomingStart,
    end_time: new Date(upcomingStart.getTime() + 5 * 60 * 60 * 1000),
    duration: 5 * 60 * 60 * 1000,
    support_end_time: new Date(upcomingStart.getTime() + 6 * 60 * 60 * 1000),
  },
  {
    name: "Dynamic Programming Bootcamp",
    slug: "dp-bootcamp",
    description:
      "Data structures and algorithm design contest with focus on DP strategies.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["maximum-subarray-sum"],
      slugToId["partition-subset"],
      slugToId["min-coin-change"],
      slugToId["lis"],
    ],
    start_time: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    end_time: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    duration: 4 * 60 * 60 * 1000,
    support_end_time: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Competitive Programming Finals",
    slug: "cp-finals-2026",
    description:
      "Grand final contest bringing together all difficulty levels.",
    created_by: adminId,
    support_team: ["support@allspark.com", "admin@allspark.com"],
    problems: [
      slugToId["two-sum-return-indices"],
      slugToId["merge-sorted-arrays"],
      slugToId["word-break"],
      slugToId["trap-rain"],
    ],
    start_time: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
    end_time: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    duration: 6 * 60 * 60 * 1000,
    support_end_time: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
  },
  {
    name: "June Classic Replay",
    slug: "june-classic-replay",
    description:
      "Curated replay of classic problems spanning easy to hard difficulty.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["factorial"],
      slugToId["binary-search-first-occurrence"],
      slugToId["best-stock-time"],
      slugToId["merge-intervals"],
    ],
    start_time: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    end_time: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    duration: 3 * 60 * 60 * 1000,
    support_end_time: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Archived Weekly #12",
    slug: "archived-weekly-12",
    description:
      "Archived weekly contest for practice and leaderboard replay analysis.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["two-sum-return-indices"],
      slugToId["binary-search-first-occurrence"],
      slugToId["number-of-islands-grid"],
      slugToId["three-sum"],
    ],
    start_time: endedStart,
    end_time: endedEnd,
    duration: endedEnd.getTime() - endedStart.getTime(),
    support_end_time: new Date(endedEnd.getTime() + 24 * 60 * 60 * 1000),
  },
];

targetDb.contests.insertMany(contests);

print("[Seed] " + contests.length + " contests seeded successfully.");

print("[Seed] Production content seeded successfully.");
printjson({
  users: targetDb.users.countDocuments(),
  problems: targetDb.problems.countDocuments(),
  contests: targetDb.contests.countDocuments(),
  participants: targetDb.participants.countDocuments(),
  submissions: targetDb.submissions.countDocuments(),
  problemsByDifficulty: {
    easy: targetDb.problems.countDocuments({ difficulty: "easy" }),
    medium: targetDb.problems.countDocuments({ difficulty: "medium" }),
    hard: targetDb.problems.countDocuments({ difficulty: "hard" }),
  },
  contestCount: contests.length,
});
