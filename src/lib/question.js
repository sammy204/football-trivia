const QUESTION_BANK = [
  // HISTORY - 10 Questions
  { question: 'Which country won the FIFA World Cup in 2018?', options: ['Brazil', 'France', 'Germany', 'Croatia'], answer: 'France', explanation: 'France defeated Croatia 4-2 in the 2018 final.', category: 'History', difficulty: 'Easy' },
  { question: 'Which country won the FIFA World Cup in 2022?', options: ['Argentina', 'France', 'Germany', 'Brazil'], answer: 'Argentina', explanation: 'Argentina won their third World Cup title in Qatar.', category: 'History', difficulty: 'Easy' },
  { question: 'In which year was the first FIFA World Cup held?', options: ['1930', '1950', '1922', '1940'], answer: '1930', explanation: 'The first FIFA World Cup was held in Uruguay in 1930.', category: 'History', difficulty: 'Easy' },
  { question: 'Which country hosted the 2016 Olympics football tournament?', options: ['Russia', 'Brazil', 'China', 'Australia'], answer: 'Brazil', explanation: 'Brazil hosted the 2016 Summer Olympics.', category: 'History', difficulty: 'Easy' },
  { question: 'Who was the manager of Brazil when they won the 2002 World Cup?', options: ['Pelé', 'Luiz Felipe Scolari', 'Carlos Alberto Parreira', 'Tele Santana'], answer: 'Luiz Felipe Scolari', explanation: 'Scolari led Brazil to their fifth World Cup title.', category: 'History', difficulty: 'Medium' },
  { question: 'Which country won the UEFA Euro 2020 championship?', options: ['Italy', 'England', 'Denmark', 'Spain'], answer: 'Italy', explanation: 'Italy defeated England on penalties in the final.', category: 'History', difficulty: 'Medium' },
  { question: 'Which team won the first ever European Cup in 1956?', options: ['Real Madrid', 'AC Milan', 'Manchester United', 'Eintracht Frankfurt'], answer: 'Real Madrid', explanation: 'Real Madrid beat Reims 4-3 in Paris.', category: 'History', difficulty: 'Hard' },
  { question: 'In which year did England win the FIFA World Cup?', options: ['1966', '1970', '1974', '1978'], answer: '1966', explanation: 'England won their only World Cup in 1966 on home soil.', category: 'History', difficulty: 'Easy' },
  { question: 'Which nation won the first FIFA World Cup held in Asia?', options: ['South Korea', 'Japan', 'Saudi Arabia', 'Qatar'], answer: 'South Korea', explanation: 'South Korea hosted the 2002 World Cup but Brazil won it.', category: 'History', difficulty: 'Medium' },
  { question: 'Who won the Golden Ball at the 2014 FIFA World Cup?', options: ['Cristiano Ronaldo', 'Mario Götze', 'Lionel Messi', 'David Luiz'], answer: 'Lionel Messi', explanation: 'Messi won the award despite Argentina losing in the final.', category: 'History', difficulty: 'Hard' },

  // PLAYERS - 10 Questions
  { question: 'Which player has won the most Ballon d\'Or awards?', options: ['Lionel Messi', 'Cristiano Ronaldo', 'Johan Cruyff', 'Michel Platini'], answer: 'Lionel Messi', explanation: 'Lionel Messi has won 8 Ballon d\'Or awards.', category: 'Players', difficulty: 'Easy' },
  { question: 'How many goals did Cristiano Ronaldo score in the 2007-08 season?', options: ['42', '53', '62', '48'], answer: '42', explanation: 'Ronaldo scored 42 goals across all competitions.', category: 'Players', difficulty: 'Easy' },
  { question: 'Which player is known as "The King of Football"?', options: ['Diego Maradona', 'Pelé', 'Ronaldinho', 'Gerd Müller'], answer: 'Pelé', explanation: 'Pelé is widely regarded as the King of Football.', category: 'Players', difficulty: 'Easy' },
  { question: 'Which player scored 5 goals in a single Premier League match?', options: ['Mohamed Salah', 'Sergio Aguero', 'Harry Kane', 'Riyad Mahrez'], answer: 'Sergio Aguero', explanation: 'Aguero scored 5 for Manchester City against Newcastle in 2015.', category: 'Players', difficulty: 'Easy' },
  { question: 'Who won the Golden Ball at the 2022 FIFA World Cup?', options: ['Lionel Messi', 'Kylian Mbappé', 'Gianluigi Donnarumma', 'Luka Modrić'], answer: 'Lionel Messi', explanation: 'Messi won the Golden Ball award in Qatar.', category: 'Players', difficulty: 'Medium' },
  { question: 'How many international goals has Cristiano Ronaldo scored?', options: ['118', '140', '150', '125'], answer: '140', explanation: 'Ronaldo is the all-time international goal scorer.', category: 'Players', difficulty: 'Medium' },
  { question: 'Which player won the Ballon d\'Or in 1998?', options: ['Zinedine Zidane', 'Ronaldo', 'Davor Šuker', 'Ronaldinho'], answer: 'Zinedine Zidane', explanation: 'Zidane won for his performances at the 1998 World Cup.', category: 'Players', difficulty: 'Hard' },
  { question: 'Which female player has won the most FIFA Women\'s World Player of the Year awards?', options: ['Mia Hamm', 'Marta', 'Abby Wambach', 'Megan Rapinoe'], answer: 'Marta', explanation: 'Brazilian Marta has won the award 6 times.', category: 'Players', difficulty: 'Medium' },
  { question: 'How many goals did Gerd Müller score for West Germany?', options: ['62', '68', '74', '78'], answer: '68', explanation: 'Müller is West Germany\'s all-time leading goal scorer.', category: 'Players', difficulty: 'Hard' },
  { question: 'Which player won the 2021 Ballon d\'Or?', options: ['Cristiano Ronaldo', 'Lionel Messi', 'Robert Lewandowski', 'Kylian Mbappé'], answer: 'Lionel Messi', explanation: 'Messi won his 7th Ballon d\'Or in 2021.', category: 'Players', difficulty: 'Easy' },

  // CLUBS - 10 Questions
  { question: 'Which club has won the most UEFA Champions League titles?', options: ['Real Madrid', 'Barcelona', 'Bayern Munich', 'Liverpool'], answer: 'Real Madrid', explanation: 'Real Madrid have won 14 Champions League titles.', category: 'Clubs', difficulty: 'Easy' },
  { question: 'Which club is known as the "Red Devils"?', options: ['Manchester United', 'Liverpool', 'AC Milan', 'Bayern Munich'], answer: 'Manchester United', explanation: 'Manchester United are nicknamed the Red Devils.', category: 'Clubs', difficulty: 'Easy' },
  { question: 'Which club won the Premier League in the 2020-21 season?', options: ['Manchester City', 'Manchester United', 'Liverpool', 'Chelsea'], answer: 'Manchester City', explanation: 'Manchester City won their third league title in four years.', category: 'Clubs', difficulty: 'Easy' },
  { question: 'How many Premier League titles has Liverpool won?', options: ['15', '18', '19', '20'], answer: '19', explanation: 'Liverpool have 19 top-flight titles.', category: 'Clubs', difficulty: 'Medium' },
  { question: 'Which club won the first Premier League title in 1992-93?', options: ['Manchester United', 'Arsenal', 'Liverpool', 'Leeds United'], answer: 'Manchester United', explanation: 'Manchester United won the inaugural Premier League.', category: 'Clubs', difficulty: 'Hard' },
  { question: 'Which Italian club has won the most Serie A titles?', options: ['Inter Milan', 'AC Milan', 'Juventus', 'Roma'], answer: 'Juventus', explanation: 'Juventus have won 36 Serie A titles.', category: 'Clubs', difficulty: 'Medium' },
  { question: 'Which Spanish club is known as "El Clásico" rival of Barcelona?', options: ['Atlético Madrid', 'Real Madrid', 'Seville', 'Valencia'], answer: 'Real Madrid', explanation: 'Real Madrid and Barcelona share the famous El Clásico rivalry.', category: 'Clubs', difficulty: 'Easy' },
  { question: 'How many times has Manchester City won the Premier League as of 2024?', options: ['3', '4', '5', '6'], answer: '6', explanation: 'Manchester City have won 6 Premier League titles.', category: 'Clubs', difficulty: 'Medium' },
  { question: 'Which club has won the FA Cup the most times?', options: ['Manchester United', 'Arsenal', 'Chelsea', 'Tottenham'], answer: 'Arsenal', explanation: 'Arsenal have won the FA Cup 14 times.', category: 'Clubs', difficulty: 'Hard' },
  { question: 'Which club won the UEFA Champions League in 2023?', options: ['Manchester City', 'Real Madrid', 'Inter Milan', 'Bayern Munich'], answer: 'Manchester City', explanation: 'Manchester City defeated Inter Milan in the 2023 final.', category: 'Clubs', difficulty: 'Easy' },

  // TRANSFERS - 10 Questions
  { question: 'Which club did Cristiano Ronaldo join in 2021?', options: ['Manchester United', 'PSG', 'Real Madrid', 'Juventus'], answer: 'Manchester United', explanation: 'Ronaldo returned to Manchester United from Juventus.', category: 'Transfers', difficulty: 'Easy' },
  { question: 'Which club did Neymar transfer to in 2017?', options: ['PSG', 'Barcelona', 'Liverpool', 'Real Madrid'], answer: 'PSG', explanation: 'Neymar joined PSG for a world record fee of €222m.', category: 'Transfers', difficulty: 'Easy' },
  { question: 'Which club did Alexis Sánchez join in 2018?', options: ['Manchester United', 'Arsenal', 'Inter Milan', 'Chelsea'], answer: 'Manchester United', explanation: 'Sánchez joined Manchester United from Arsenal.', category: 'Transfers', difficulty: 'Easy' },
  { question: 'What was the transfer fee for Mbappé to Real Madrid in 2024?', options: ['Free transfer', '€180m', '€250m', '€300m'], answer: 'Free transfer', explanation: 'Mbappé joined Real Madrid as a free agent.', category: 'Transfers', difficulty: 'Easy' },
  { question: 'Which club did Zinedine Zidane join for a world record fee in 2001?', options: ['Barcelona', 'Real Madrid', 'Manchester United', 'AC Milan'], answer: 'Real Madrid', explanation: 'Zidane joined Real Madrid for €75m, a world record at the time.', category: 'Transfers', difficulty: 'Medium' },
  { question: 'Which player joined Manchester City from Tottenham in 2020 for €63m?', options: ['Tanguy Ndombele', 'Dele Alli', 'Ruben Dias', 'Jack Grealish'], answer: 'Ruben Dias', explanation: 'Ruben Dias was the first signing of Manchester City\'s summer campaign.', category: 'Transfers', difficulty: 'Medium' },
  { question: 'Which player did Liverpool sign from Southampton in 2014 for €45m?', options: ['Raheem Sterling', 'Luis Alberto', 'Sadio Mané', 'Roberto Firmino'], answer: 'Raheem Sterling', explanation: 'Sterling joined Liverpool from QPR, but many remember Southampton signings.', category: 'Transfers', difficulty: 'Medium' },
  { question: 'What was the transfer fee for Gareth Bale to Real Madrid in 2013?', options: ['€85m', '€100m', '€110m', '€90m'], answer: '€100m', explanation: 'Bale became the world\'s most expensive player.', category: 'Transfers', difficulty: 'Hard' },
  { question: 'Which player joined Barcelona from Liverpool for €160m in 2018?', options: ['Philippe Coutinho', 'Luis Suárez', 'Neymar', 'Andrés Iniesta'], answer: 'Philippe Coutinho', explanation: 'Coutinho joined Barcelona during the 2018 winter transfer window.', category: 'Transfers', difficulty: 'Hard' },
  { question: 'Which player transferred from Ajax to Manchester United for €85m in 2019?', options: ['Frenkie de Jong', 'Donny van de Beek', 'Matthijs de Ligt', 'Sergiño Dest'], answer: 'Donny van de Beek', explanation: 'Van de Beek signed from Ajax during the 2020 transfer window.', category: 'Transfers', difficulty: 'Hard' },

  // TROPHIES - 10 Questions
  { question: 'Which football trophy is nicknamed the "Big Ears"?', options: ['FA Cup', 'UEFA Europa League', 'UEFA Champions League', 'Copa del Rey'], answer: 'UEFA Champions League', explanation: 'The Champions League trophy is often called the Big Ears.', category: 'Trophies', difficulty: 'Easy' },
  { question: 'Which trophy is awarded to the best player at the FIFA World Cup?', options: ['Golden Ball', 'Ballon d\'Or', 'Player of the Match', 'World Cup Star'], answer: 'Golden Ball', explanation: 'The Golden Ball is given to the tournament\'s best player.', category: 'Trophies', difficulty: 'Easy' },
  { question: 'How many times has Spain won the UEFA European Championship?', options: ['1', '2', '3', '4'], answer: '4', explanation: 'Spain won in 1964, 2008, 2012, and 2024.', category: 'Trophies', difficulty: 'Medium' },
  { question: 'Which team has won the most Copa America titles?', options: ['Argentina', 'Brazil', 'Uruguay', 'Paraguay'], answer: 'Uruguay', explanation: 'Uruguay has won the Copa America 15 times.', category: 'Trophies', difficulty: 'Hard' },
  { question: 'Which country has won the FIFA World Cup the most times?', options: ['Germany', 'France', 'Brazil', 'Argentina'], answer: 'Brazil', explanation: 'Brazil has won the World Cup 5 times.', category: 'Trophies', difficulty: 'Easy' },
  { question: 'What is the name of the South American club championship?', options: ['Copa Libertadores', 'Copa America', 'South American Cup', 'Sudamericana'], answer: 'Copa Libertadores', explanation: 'The Copa Libertadores is the top club competition in South America.', category: 'Trophies', difficulty: 'Medium' },
  { question: 'Which club has won the most Copa Libertadores titles?', options: ['Peñarol', 'Independiente', 'Boca Juniors', 'River Plate'], answer: 'Peñarol', explanation: 'Peñarol has won 5 Copa Libertadores titles.', category: 'Trophies', difficulty: 'Hard' },
  { question: 'How many times has Germany won the FIFA World Cup?', options: ['3', '4', '5', '6'], answer: '4', explanation: 'Germany has won the World Cup 4 times (1954, 1974, 1990, 2014).', category: 'Trophies', difficulty: 'Medium' },
  { question: 'Which trophy is awarded to the top scorer at the FIFA World Cup?', options: ['Golden Boot', 'Golden Ball', 'Bronze Boot', 'Silver Shoe'], answer: 'Golden Boot', explanation: 'The Golden Boot is given to the top goal scorer.', category: 'Trophies', difficulty: 'Easy' },
  { question: 'How many times has France won the FIFA World Cup?', options: ['1', '2', '3', '4'], answer: '2', explanation: 'France won in 1998 and 2018.', category: 'Trophies', difficulty: 'Medium' },

  // RULES - 10 Questions
  { question: 'How many players are on the field for one team?', options: ['9', '10', '11', '12'], answer: '11', explanation: 'Football is played with 11 players per side.', category: 'Rules', difficulty: 'Easy' },
  { question: 'How long is a standard football match?', options: ['80 minutes', '90 minutes', '100 minutes', '75 minutes'], answer: '90 minutes', explanation: 'A match consists of two 45-minute halves.', category: 'Rules', difficulty: 'Easy' },
  { question: 'What does a yellow card signify in football?', options: ['Free kick', 'Caution/Warning', 'Goal kick', 'Throw-in'], answer: 'Caution/Warning', explanation: 'A yellow card is a caution for misconduct.', category: 'Rules', difficulty: 'Easy' },
  { question: 'How many substitutes can a team make in a standard match?', options: ['2', '3', '5', '7'], answer: '3', explanation: 'Teams can make 3 substitutions in a regular match (5 in extra time).', category: 'Rules', difficulty: 'Easy' },
  { question: 'What is the penalty for a handball in the penalty area?', options: ['Free kick', 'Corner kick', 'Penalty kick', 'Yellow card'], answer: 'Penalty kick', explanation: 'Deliberate handball in the penalty area results in a penalty.', category: 'Rules', difficulty: 'Medium' },
  { question: 'What is the VAR (Video Assistant Referee) used for?', options: ['Attacking decisions only', 'Defensive plays only', 'Clear and obvious errors', 'Every decision'], answer: 'Clear and obvious errors', explanation: 'VAR reviews clear and obvious errors on the field.', category: 'Rules', difficulty: 'Medium' },
  { question: 'What does a red card mean in football?', options: ['Warning', 'Dismissal', 'Penalty', 'Foul'], answer: 'Dismissal', explanation: 'A red card results in immediate expulsion from the match.', category: 'Rules', difficulty: 'Easy' },
  { question: 'How much of the ball must cross the goal line for a goal to count?', options: ['Half', 'Whole ball', 'Part of it', 'Top curve'], answer: 'Whole ball', explanation: 'The entire ball must completely cross the goal line.', category: 'Rules', difficulty: 'Medium' },
  { question: 'What is an offside position in football?', options: ['Standing too close to opponent', 'Being ahead of all defenders', 'Standing on sidelines', 'In goalkeeper\'s area'], answer: 'Being ahead of all defenders', explanation: 'A player is in an offside position if they are nearer to the opponent\'s goal line than both the ball and at least two opponents.', category: 'Rules', difficulty: 'Hard' },
  { question: 'How long is each halftime break in a standard match?', options: ['10 minutes', '15 minutes', '20 minutes', '25 minutes'], answer: '15 minutes', explanation: 'Halftime lasts 15 minutes between the two halves.', category: 'Rules', difficulty: 'Easy' },
]

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function generateQuestions({ rounds }) {
  const source = QUESTION_BANK
  const questions = shuffle(source).slice(0, rounds || 5)
  return questions.map(q => ({ ...q }))
}
