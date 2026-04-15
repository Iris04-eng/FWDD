CREATE DATABASE FWDD_assignment;

USE FWDD_assignment;

CREATE TABLE user (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game (
  game_id INT AUTO_INCREMENT PRIMARY KEY,
  host_user_id INT,
  status VARCHAR(20) DEFAULT 'Waiting',
  max_players INT DEFAULT 4,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_time DATETIME,
  end_time DATETIME,
  winner_player_id INT NULL,
  FOREIGN KEY (host_user_id) REFERENCES user(user_id)
);
ALTER TABLE game
ADD join_code VARCHAR(10) UNIQUE;

ALTER TABLE game
ADD current_turn_player_id INT;

CREATE TABLE player (
  player_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  game_id INT,
  position INT DEFAULT 0,
  lives INT DEFAULT 5,
  points INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Alive',
  FOREIGN KEY (user_id) REFERENCES user(user_id),
  FOREIGN KEY (game_id) REFERENCES game(game_id)
);
ALTER TABLE player
ADD COLUMN infection_lives INT DEFAULT 0;

ALTER TABLE game
ADD FOREIGN KEY (winner_player_id) REFERENCES player(player_id);

ALTER TABLE player
ADD COLUMN player_name VARCHAR(50);

CREATE TABLE question (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  question_difficulty VARCHAR(20),
  question_text TEXT NOT NULL,
  question_answer VARCHAR(255) NOT NULL,
  explanation TEXT
);

ALTER TABLE question
ADD option_a VARCHAR(255),
ADD option_b VARCHAR(255),
ADD option_c VARCHAR(255),
ADD option_d VARCHAR(255),
MODIFY question_answer VARCHAR(1);

CREATE TABLE game_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT,
  player_id INT,
  question_id INT,
  turn_number INT,
  dice_value INT,
  result VARCHAR(50),
  life_change INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES game(game_id),
  FOREIGN KEY (player_id) REFERENCES player(player_id),
  FOREIGN KEY (question_id) REFERENCES question(question_id)
);

CREATE TABLE skill (
  skill_id INT AUTO_INCREMENT PRIMARY KEY,
  descriptions VARCHAR(255),
  cost_points INT
);
ALTER TABLE player ADD active_skill INT NULL;

ALTER TABLE skill ADD skillName VARCHAR(20);

CREATE TABLE player_skill (
  player_skill_id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT,
  skill_id INT,
  is_skill_used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (player_id) REFERENCES player(player_id),
  FOREIGN KEY (skill_id) REFERENCES skill(skill_id)
);

INSERT INTO question 
(question_difficulty, question_text, question_answer, explanation, option_a, option_b, option_c, option_d)
VALUES
('Easy',
'What is the output?\n\nx = 5\nif x > 3:\n    print("Hello")',
'A',
'The condition x > 3 is True (5 > 3), so the print statement runs.',
'Hello','Nothing','Error','5'),

('Easy',
'What is the output?\n\nif False:\n    print("A")\nelse:\n    print("B")',
'B',
'The condition is False, so the else block executes.',
'A','B','Nothing','Error'),

('Easy',
'What is the output?\n\nfor i in range(3):\n    print(i)',
'A',
'range(3) generates 0, 1, 2. The loop prints each value.',
'0 1 2','1 2 3','0 1 2 3','Error'),

('Easy',
'What is the output?\n\nif True:\n    print("A")\nprint("B")',
'A',
'The first print runs because condition is True, then second print runs normally.',
'A B','A','B','Error'),

('Easy',
'What is the output?\n\nx = 0\nif x:\n    print("Yes")\nelse:\n    print("No")',
'B',
'0 is treated as False in Python, so the else block runs.',
'Yes','No','Error','Nothing'),

('Easy',
'What is the output?\n\nif 2 < 5:\n    print("OK")',
'A',
'2 is less than 5, so the condition is True and prints OK.',
'OK','Error','Nothing','False'),

('Easy',
'What is the output?\n\nx = 10\nif x == 10:\n    print("Match")',
'A',
'x equals 10, so the condition is True and prints Match.',
'Match','No','Error','Nothing'),

('Easy',
'What is the output?\n\nfor i in range(1):\n    print("Hi")',
'A',
'range(1) runs once (i=0), so "Hi" prints once.',
'Hi','Nothing','Error','Hi Hi'),

('Easy',
'What is the output?\n\nif not False:\n    print("Yes")',
'A',
'not False becomes True, so the print statement executes.',
'Yes','No','Error','Nothing'),

('Easy',
'What is the output?\n\nx = 5\nif x != 3:\n    print("A")',
'A',
'5 is not equal to 3, so condition is True.',
'A','B','Error','Nothing'),

('Easy',
'What is the output?\n\nif True:\n    if False:\n        print("A")\n    else:\n        print("B")',
'B',
'Outer condition is True, inner condition is False, so else runs.',
'A','B','Nothing','Error'),

('Easy',
'What is the output?\n\nfor i in range(3):\n    if i == 2:\n        print(i)',
'A',
'Only when i equals 2, the print statement runs.',
'2','0 1 2','Error','Nothing'),

('Easy',
'What is the output?\n\nx = 1\nif x:\n    print("Yes")',
'A',
'Any non-zero number is True in Python.',
'Yes','No','Error','Nothing'),

('Easy',
'What is the output?\n\nif []:\n    print("Yes")\nelse:\n    print("No")',
'B',
'An empty list is False in Python, so else runs.',
'Yes','No','Error','Nothing'),

('Easy',
'What is the output?\n\nfor i in range(2):\n    print("A")',
'A',
'The loop runs twice (i=0 and i=1), so prints A twice.',
'A A','A','Error','Nothing'),

('Easy',
'What is the output?\n\nx = 4\nif x > 5:\n    print("A")\nelse:\n    print("B")',
'B',
'4 is not greater than 5, so else block runs.',
'A','B','Error','Nothing'),

('Easy',
'What is the output?\n\nif True:\n    pass\nprint("Done")',
'A',
'pass does nothing, so execution continues and prints Done.',
'Done','Nothing','Error','Pass'),

('Easy',
'What is the output?\n\nfor i in range(1,3):\n    print(i)',
'A',
'range(1,3) gives 1 and 2.',
'1 2','0 1','1 2 3','Error'),

('Easy',
'What is the output?\n\nx = -1\nif x:\n    print("Yes")',
'A',
'Any non-zero number (even negative) is True.',
'Yes','No','Error','Nothing'),

('Easy',
'What is the output?\n\nif not True:\n    print("A")\nelse:\n    print("B")',
'B',
'not True is False, so else block executes.',
'A','B','Error','Nothing');

INSERT INTO question 
(question_difficulty, question_text, question_answer, explanation, option_a, option_b, option_c, option_d)
VALUES
('Moderate',
'What is the output?\n\nfor i in range(3):\n    if i == 1:\n        continue\n    print(i)',
'A',
'continue skips i=1, so only 0 and 2 are printed.',
'0 2','1 2','0 1 2','Error'),

('Moderate',
'What is the purpose of the "continue" statement in Python?',
'B',
'continue skips the current iteration and moves to the next loop cycle.',
'Stop the loop','Skip current iteration','Restart loop','Exit program'),

('Moderate',
'What is the output?\n\nif 1 and 0:\n    print("A")\nelse:\n    print("B")',
'C',
'1 is True, 0 is False → overall False → else runs.',
'A','Nothing','B','Error'),

('Moderate',
'Which statement is used to exit a loop immediately?',
'A',
'break stops the loop immediately.',
'break','continue','pass','exit'),

('Moderate',
'What is the output?\n\nx = 3\nif x > 5:\n    print("A")\nelif x > 2:\n    print("B")',
'D',
'First condition false, second true → prints B.',
'A','Nothing','Error','B'),

('Moderate',
'What is the difference between "if" and "elif"?',
'B',
'elif is used to check additional conditions if previous ones are false.',
'No difference','elif checks additional conditions','elif is a loop','elif ends program'),

('Moderate',
'What is the output?\n\nfor i in range(2):\n    for j in range(2):\n        print(i + j)',
'A',
'Outputs 0,1,1,2 from nested loops.',
'0 1 1 2','1 2','0 1','Error'),

('Moderate',
'What does the "pass" statement do?',
'D',
'pass does nothing and is used as a placeholder.',
'Stops loop','Skips iteration','Raises error','Does nothing'),

('Moderate',
'What is the output?\n\nif not (2 > 1):\n    print("A")\nelse:\n    print("B")',
'C',
'2 > 1 is True → not True is False → else runs.',
'A','Nothing','B','Error'),

('Moderate',
'Which of the following is considered False in Python?',
'A',
'Empty list is treated as False.',
'[]','[1]','"Hello"','True'),

('Moderate',
'What is the output?\n\nx = 2\nif x == 2:\n    print("A")\nif x < 3:\n    print("B")',
'B',
'Both conditions are checked separately, so both print.',
'A','A B','B','Error'),

('Moderate',
'What does "elif" stand for?',
'C',
'elif means "else if".',
'else loop','end if','else if','error if'),

('Moderate',
'What is the output?\n\nfor i in range(3):\n    if i % 2 == 0:\n        print(i)',
'D',
'Prints even numbers 0 and 2.',
'1 2','0 1','Error','0 2'),

('Moderate',
'When will the "else" block of a loop execute?',
'A',
'It runs when the loop completes normally (no break).',
'After break','When error occurs','Always','Never'),

('Moderate',
'What is the output?\n\nx = 0\nif x or 1:\n    print("Run")',
'B',
'0 is False, 1 is True → condition is True.',
'Nothing','Run','Error','0'),

('Moderate',
'What does "range(1,4)" produce?',
'D',
'It generates numbers 1, 2, and 3 (end excluded).',
'0 1 2','1 2 3 4','2 3 4','1 2 3'),

('Moderate',
'What is the output?\n\nif [] or 1:\n    print("Yes")',
'C',
'Empty list is False, 1 is True → condition True.',
'No','Nothing','Yes','Error'),

('Moderate',
'Which keyword is used to skip one iteration in a loop?',
'B',
'continue skips the current iteration.',
'break','continue','pass','skip'),

('Moderate',
'What is the output?\n\nif None:\n    print("A")\nelse:\n    print("B")',
'A',
'None is False, so else block runs.',
'B','A','Error','Nothing'),

('Moderate',
'Which operator checks both conditions must be True?',
'D',
'The "and" operator requires both conditions to be True.',
'or','not','if','and');

INSERT INTO question 
(question_difficulty, question_text, question_answer, explanation, option_a, option_b, option_c, option_d)
VALUES
('Hard',
'Fill in the blank:\n\nfor i in range(3):\n    if i == 1:\n        ____\n    print(i)',
'B',
'continue skips i=1 so output becomes 0 and 2.',
'break','continue','pass','stop'),

('Hard',
'What is the output?\n\nfor i in range(3):\n    if i == 1:\n        break\n    print(i)',
'A',
'Loop stops at i=1, so only 0 is printed.',
'0','1','0 1','Error'),

('Hard',
'Fill in the blank:\n\nx = 5\nif x > 3:\n    print("A")\n____ x > 4:\n    print("B")',
'C',
'elif is used for additional condition after if.',
'if','else','elif','while'),

('Hard',
'What is the output?\n\nx = 5\nif x > 2:\n    print("A")\n    if x > 10:\n        print("B")\n    else:\n        print("C")',
'D',
'Second condition is false so prints C after A.',
'A B','C','A','A C'),

('Hard',
'Fill in the blank:\n\nfor i in range(2):\n    for j in range(2):\n        if i == j:\n            ____\n        print(i, j)',
'A',
'break exits the inner loop when i == j.',
'break','continue','pass','stop'),

('Hard',
'What is the output?\n\nfor i in range(2):\n    for j in range(2):\n        if j == 1:\n            continue\n        print(i)',
'B',
'Only prints when j=0 → prints 0 and 1.',
'0 0','0 1','1 1','Error'),

('Hard',
'Fill in the blank:\n\nif not (2 > 1):\n    print("A")\n____:\n    print("B")',
'D',
'else is used when condition is False.',
'elif','if','while','else'),

('Hard',
'What is the output?\n\nx = 0\nfor i in range(3):\n    x += i\nprint(x)',
'A',
'Sum = 0 + 1 + 2 = 3.',
'3','2','1','0'),

('Hard',
'Fill in the blank:\n\nfor i in range(3):\n    if i % 2 == 0:\n        ____\n    print(i)',
'C',
'pass does nothing, so all values still print.',
'break','continue','pass','skip'),

('Hard',
'What is the output?\n\nif 1 and 2:\n    print("Yes")',
'D',
'Both are non-zero → True.',
'No','Nothing','Error','Yes'),

('Hard',
'Fill in the blank:\n\nx = 3\nif x > 1:\n    if x > 2:\n        ____("A")',
'B',
'print is required to display output.',
'echo','print','show','write'),

('Hard',
'What is the output?\n\nfor i in range(3):\n    if i == 2:\n        break\n    print(i)\nelse:\n    print("Done")',
'C',
'break prevents else from running.',
'0 1 Done','Done','0 1','Error'),

('Hard',
'Fill in the blank:\n\nfor i in range(3):\n    if i == 1:\n        ____\n    else:\n        print(i)',
'A',
'continue skips i=1.',
'continue','break','pass','stop'),

('Hard',
'What is the output?\n\nx = 5\nif x > 3 and x < 10:\n    print("Valid")',
'B',
'Both conditions true.',
'Invalid','Valid','Error','Nothing'),

('Hard',
'Fill in the blank:\n\nif ____ (True and False):\n    print("A")\nelse:\n    print("B")',
'D',
'not(False) becomes True.',
'and','or','if','not'),

('Hard',
'What is the output?\n\nfor i in range(2):\n    for j in range(2):\n        print(i*j)',
'A',
'Results: 0 0 0 1.',
'0 0 0 1','1 1','0 1','Error'),

('Hard',
'Fill in the blank:\n\nx = 0\nif x ____ 1:\n    print("Yes")',
'C',
'or makes condition True because 1 is True.',
'and','not','or','=='),

('Hard',
'What is the output?\n\nif [] and 1:\n    print("A")\nelse:\n    print("B")',
'B',
'Empty list is False → overall False.',
'A','B','Error','Nothing'),

('Hard',
'Fill in the blank:\n\nfor i in range(3):\n    if i == 2:\n        ____\n    print(i)',
'B',
'break stops loop at i=2.',
'continue','break','pass','skip'),

('Hard',
'What is the output?\n\nx = 3\nif x > 1:\n    if x > 2:\n        if x > 5:\n            print("A")\n        else:\n            print("B")',
'D',
'Only last else executes.',
'A','Nothing','Error','B');

INSERT INTO question 
(question_difficulty, question_text, question_answer, explanation, option_a, option_b, option_c, option_d)
VALUES
('Extreme',
'What is the output?\n\nfor i in range(2):\n    for j in range(2):\n        for k in range(2):\n            if i == j == k:\n                print(i, j, k)',
'A',
'Only prints when all are equal → (0,0,0) and (1,1,1).',
'0 0 0 1 1 1','All combinations','0 0 0','Error'),

('Extreme',
'What is the output?\n\nfor i in range(3):\n    for j in range(3):\n        if j == 1:\n            break\n        print(i, j)',
'B',
'Inner loop breaks at j=1, so only j=0 prints for each i.',
'0 0 0 1','0 0 1 0 2 0','0 0','Error'),

('Extreme',
'What is the output?\n\nfor i in range(3):\n    for j in range(3):\n        if i == j:\n            continue\n        print(i, j)',
'C',
'Skips when i==j → prints all unequal pairs.',
'All pairs','Only equal pairs','Pairs where i != j','Error'),

('Extreme',
'Fill in the blank:\n\nfor i in range(3):\n    if i == 2:\n        ____\n    print(i)',
'D',
'continue skips i=2 so output is 0,1.',
'break','pass','stop','continue'),

('Extreme',
'What is the output?\n\nif False or True and False or True:\n    print("A")',
'A',
'AND first → True and False = False → False or False or True = True.',
'A','B','Error','Nothing'),

('Extreme',
'What is the output?\n\nfor i in range(3):\n    for j in range(3):\n        if i == 1:\n            break\n        print(i, j)',
'C',
'When i=1, inner loop breaks immediately → only i=0 and i=2 print partially.',
'0 0 0 1','1 0','0 0 0 1 2 0 2 1 2 2','Error'),

('Extreme',
'What is the output?\n\nx = 0\nfor i in range(2):\n    for j in range(2):\n        for k in range(2):\n            x += i + j + k\nprint(x)',
'B',
'Sum of all combinations = 12.',
'8','12','6','Error'),

('Extreme',
'Fill in the blank:\n\nif ____ (True and False):\n    print("A")\nelse:\n    print("B")',
'A',
'not(False) becomes True.',
'not','and','or','if'),

('Extreme',
'What is the output?\n\nfor i in range(3):\n    if i == 1:\n        break\nelse:\n    print("Done")',
'D',
'Loop breaks → else will NOT run.',
'Done','Error','Nothing','No output'),

('Extreme',
'What is the output?\n\nif 2 > 1 > 0:\n    print("A")',
'C',
'Chain comparison: both conditions true.',
'False','Error','A','Nothing'),

('Extreme',
'What is the output?\n\nfor i in range(3):\n    if i == 1:\n        continue\n    if i == 2:\n        break\n    print(i)',
'A',
'i=0 prints, i=1 skipped, i=2 breaks.',
'0','1','0 1','Error'),

('Extreme',
'What is the output?\n\nfor i in range(2):\n    for j in range(2):\n        for k in range(2):\n            if i + j + k == 2:\n                print(i, j, k)',
'B',
'Prints combinations where sum = 2.',
'All combos','Valid sum=2 combos','None','Error'),

('Extreme',
'What is the output?\n\nif (1 and 0) or (0 or 5):\n    print("Yes")',
'D',
'(1 and 0)=0, (0 or 5)=5 → True.',
'No','Error','Nothing','Yes'),

('Extreme',
'Fill in the blank:\n\nfor i in range(3):\n    if i == 1:\n        ____\n    else:\n        print(i)',
'B',
'continue skips i=1.',
'break','continue','pass','skip'),

('Extreme',
'What is the output?\n\nfor i in range(2):\n    for j in range(2):\n        for k in range(2):\n            if k == 1:\n                break\n            print(i, j, k)',
'A',
'Break only stops innermost loop → prints when k=0.',
'0 0 0 0 1 0 1 0 0 1 1 0','All combos','Error','Nothing');

INSERT INTO skill (descriptions, cost_points) VALUES
('Sprint - Instantly boosts your movement speed, allowing your character to advance an additional 2 tiles after rolling the dice. This can help you escape danger zones or reach checkpoints faster.', 10),
('Erase - Removes one incorrect answer from the multiple-choice options, increasing your chances of selecting the correct answer. This skill is especially useful for difficult questions.', 10),
('Immunity - Grants temporary protection against penalties. If you answer a question incorrectly, you will not lose any lives or suffer negative effects for that turn.', 15),
('Vaccine - Restores your health by healing lost lives or curing any infection status caused by traps or wrong answers. Helps you stay longer in the game.', 15),
('Block - Prevents the next player in turn from taking their action. The blocked player will lose one turn, giving you a strategic advantage.', 15),
('Revive - Automatically brings your character back to life once after all lives are lost. You will continue the game with a second chance.', 25),
('Double - Doubles the points you gain from your next correct answer or action. This skill is useful for boosting your score quickly.', 20);

select * from user;
select * from game;
select * from question;
select * from skill;
select * from player;
select * from player_skill;
select * from game_log;