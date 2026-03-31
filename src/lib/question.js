const QUESTION_BANK = [
  { question: 'Which country won the FIFA World Cup in 2018?', options: ['Brazil', 'France', 'Germany', 'Croatia'], answer: 'France', explanation: 'France defeated Croatia 4-2 in the 2018 final.' },
  { question: 'Which country won the FIFA World Cup in 2022?', options: ['Argentina', 'France', 'Germany', 'Brazil'], answer: 'Argentina', explanation: 'Argentina won their third World Cup title in Qatar.' },
  { question: 'In which year was the first FIFA World Cup held?', options: ['1930', '1950', '1922', '1940'], answer: '1930', explanation: 'The first FIFA World Cup was held in Uruguay in 1930.' },
  { question: 'Which country hosted the 2016 Olympics football tournament?', options: ['Russia', 'Brazil', 'China', 'Australia'], answer: 'Brazil', explanation: 'Brazil hosted the 2016 Summer Olympics.' },
  { question: 'Who was the manager of Brazil when they won the 2002 World Cup?', options: ['Pelé', 'Luiz Felipe Scolari', 'Carlos Alberto Parreira', 'Tele Santana'], answer: 'Luiz Felipe Scolari', explanation: 'Scolari led Brazil to their fifth World Cup title.' },
  { question: 'Which country won the UEFA Euro 2020 championship?', options: ['Italy', 'England', 'Denmark', 'Spain'], answer: 'Italy', explanation: 'Italy defeated England on penalties in the final.' },
  { question: 'Which team won the first ever European Cup in 1956?', options: ['Real Madrid', 'AC Milan', 'Manchester United', 'Eintracht Frankfurt'], answer: 'Real Madrid', explanation: 'Real Madrid beat Reims 4-3 in Paris.' },
  { question: 'In which year did England win the FIFA World Cup?', options: ['1966', '1970', '1974', '1978'], answer: '1966', explanation: 'England won their only World Cup in 1966 on home soil.' },
  { question: 'Which nation won the first FIFA World Cup held in Asia?', options: ['South Korea', 'Japan', 'Brazil', 'Germany'], answer: 'Brazil', explanation: 'The 2002 World Cup was hosted jointly by South Korea and Japan, but Brazil won the tournament.' },
  { question: 'Who won the Golden Ball at the 2014 FIFA World Cup?', options: ['Cristiano Ronaldo', 'Mario Götze', 'Lionel Messi', 'David Luiz'], answer: 'Lionel Messi', explanation: 'Messi won the award despite Argentina losing in the final.' },
  { question: 'Which player has won the most Ballon d\'Or awards?', options: ['Lionel Messi', 'Cristiano Ronaldo', 'Johan Cruyff', 'Michel Platini'], answer: 'Lionel Messi', explanation: 'Lionel Messi has won 8 Ballon d\'Or awards.' },
  { question: 'How many goals did Cristiano Ronaldo score in the 2007-08 season?', options: ['42', '53', '62', '48'], answer: '42', explanation: 'Ronaldo scored 42 goals across all competitions that season.' },
  { question: 'Which player is known as "The King of Football"?', options: ['Diego Maradona', 'Pelé', 'Ronaldinho', 'Gerd Müller'], answer: 'Pelé', explanation: 'Pelé is widely regarded as the King of Football.' },
  { question: 'Which player scored 5 goals in a single Premier League match?', options: ['Mohamed Salah', 'Sergio Aguero', 'Harry Kane', 'Riyad Mahrez'], answer: 'Sergio Aguero', explanation: 'Aguero scored 5 for Manchester City against Newcastle in 2015.' },
  { question: 'Who won the Golden Ball at the 2022 FIFA World Cup?', options: ['Lionel Messi', 'Kylian Mbappé', 'Gianluigi Donnarumma', 'Luka Modrić'], answer: 'Lionel Messi', explanation: 'Messi won the Golden Ball award in Qatar.' },
  { question: 'How many international goals has Cristiano Ronaldo scored?', options: ['118', '130', '138', '125'], answer: '138', explanation: 'Ronaldo holds the record as the all-time leading international goal scorer.' },
  { question: 'Which player won the Ballon d\'Or in 1998?', options: ['Zinedine Zidane', 'Ronaldo', 'Davor Šuker', 'Ronaldinho'], answer: 'Zinedine Zidane', explanation: 'Zidane won the 1998 Ballon d\'Or for his outstanding performances, including at the 1998 World Cup.' },
  { question: 'Which female player has won the most FIFA Women\'s World Player of the Year awards?', options: ['Mia Hamm', 'Marta', 'Abby Wambach', 'Megan Rapinoe'], answer: 'Marta', explanation: 'Brazilian Marta has won the award 6 times.' },
  { question: 'How many goals did Gerd Müller score for West Germany?', options: ['62', '68', '74', '78'], answer: '68', explanation: 'Müller is West Germany\'s all-time leading goal scorer with 68 goals.' },
  { question: 'Which player won the 2021 Ballon d\'Or?', options: ['Cristiano Ronaldo', 'Lionel Messi', 'Robert Lewandowski', 'Kylian Mbappé'], answer: 'Lionel Messi', explanation: 'Messi won his 7th Ballon d\'Or in 2021.' },
  { question: 'Which club has won the most UEFA Champions League titles?', options: ['Real Madrid', 'Barcelona', 'Bayern Munich', 'Liverpool'], answer: 'Real Madrid', explanation: 'Real Madrid have won the most Champions League titles.' },
  { question: 'Which club is known as the "Red Devils"?', options: ['Manchester United', 'Liverpool', 'AC Milan', 'Bayern Munich'], answer: 'Manchester United', explanation: 'Manchester United are nicknamed the Red Devils.' },
  { question: 'Which club won the Premier League in the 2020-21 season?', options: ['Manchester City', 'Manchester United', 'Liverpool', 'Chelsea'], answer: 'Manchester City', explanation: 'Manchester City won their third league title in four years.' },
  { question: 'How many top-flight league titles has Liverpool won?', options: ['15', '18', '19', '20'], answer: '20', explanation: 'Liverpool have won 20 top-flight English league titles in total.' },
  { question: 'Which club won the first Premier League title in 1992-93?', options: ['Manchester United', 'Arsenal', 'Liverpool', 'Leeds United'], answer: 'Manchester United', explanation: 'Manchester United won the inaugural Premier League season.' },
  { question: 'Which Italian club has won the most Serie A titles?', options: ['Inter Milan', 'AC Milan', 'Juventus', 'Roma'], answer: 'Juventus', explanation: 'Juventus have won the most Serie A titles.' },
  { question: 'Which Spanish club is known as "El Clásico" rival of Barcelona?', options: ['Atlético Madrid', 'Real Madrid', 'Seville', 'Valencia'], answer: 'Real Madrid', explanation: 'Real Madrid and Barcelona share the famous El Clásico rivalry.' },
  { question: 'How many times has Manchester City won the Premier League as of 2024?', options: ['3', '4', '5', '6'], answer: '6', explanation: 'Manchester City have won 6 Premier League titles.' },
  { question: 'Which club has won the FA Cup the most times?', options: ['Manchester United', 'Arsenal', 'Chelsea', 'Tottenham'], answer: 'Arsenal', explanation: 'Arsenal have won the FA Cup more times than any other club.' },
  { question: 'Which club won the UEFA Champions League in 2023?', options: ['Manchester City', 'Real Madrid', 'Inter Milan', 'Bayern Munich'], answer: 'Manchester City', explanation: 'Manchester City defeated Inter Milan in the 2023 final.' },
  { question: 'Which club did Cristiano Ronaldo join in 2021?', options: ['Manchester United', 'PSG', 'Real Madrid', 'Juventus'], answer: 'Manchester United', explanation: 'Ronaldo returned to Manchester United from Juventus in 2021.' },
  { question: 'Which club did Neymar transfer to in 2017?', options: ['PSG', 'Barcelona', 'Liverpool', 'Real Madrid'], answer: 'PSG', explanation: 'Neymar joined PSG from Barcelona for a world record fee of €222m.' },
  { question: 'Which club did Alexis Sánchez join in January 2018?', options: ['Manchester United', 'Arsenal', 'Inter Milan', 'Chelsea'], answer: 'Manchester United', explanation: 'Sánchez joined Manchester United from Arsenal in the January 2018 transfer window.' },
  { question: 'How did Kylian Mbappé join Real Madrid in 2024?', options: ['Free transfer', '€180m', '€250m', '€300m'], answer: 'Free transfer', explanation: 'Mbappé joined Real Madrid on a free transfer after his PSG contract expired.' },
  { question: 'Which club did Zinedine Zidane join for a world record fee in 2001?', options: ['Barcelona', 'Real Madrid', 'Manchester United', 'AC Milan'], answer: 'Real Madrid', explanation: 'Zidane joined Real Madrid for €75m from Juventus, a world record at the time.' },
  { question: 'Which defender joined Manchester City from Benfica in 2020 for around €68m?', options: ['Nathan Aké', 'Aymeric Laporte', 'Rúben Dias', 'John Stones'], answer: 'Rúben Dias', explanation: 'Rúben Dias signed from Benfica and went on to win the Premier League Player of the Season in 2020-21.' },
  { question: 'Which player did Liverpool sign from Southampton in 2014?', options: ['Adam Lallana', 'Raheem Sterling', 'Sadio Mané', 'Roberto Firmino'], answer: 'Adam Lallana', explanation: 'Adam Lallana joined Liverpool from Southampton in the summer of 2014.' },
  { question: 'What was the reported transfer fee for Gareth Bale to Real Madrid in 2013?', options: ['€85m', '€100m', '€110m', '€90m'], answer: '€100m', explanation: 'Gareth Bale joined Real Madrid from Tottenham for a then-world record fee of around €100m.' },
  { question: 'Which player joined Barcelona from Liverpool for €160m in January 2018?', options: ['Philippe Coutinho', 'Luis Suárez', 'Neymar', 'Andrés Iniesta'], answer: 'Philippe Coutinho', explanation: 'Philippe Coutinho joined Barcelona from Liverpool during the January 2018 transfer window.' },
  { question: 'Which Ajax midfielder joined Barcelona for around €86m in the summer of 2019?', options: ['Frenkie de Jong', 'Donny van de Beek', 'Matthijs de Ligt', 'Daley Blind'], answer: 'Frenkie de Jong', explanation: 'Frenkie de Jong completed a high-profile move from Ajax to Barcelona for around €86m in 2019.' },
  { question: 'Which football trophy is nicknamed the "Big Ears"?', options: ['FA Cup', 'UEFA Europa League', 'UEFA Champions League', 'Copa del Rey'], answer: 'UEFA Champions League', explanation: 'The Champions League trophy is often called Big Ears due to its distinctive handles.' },
  { question: 'Which trophy is awarded to the best player at the FIFA World Cup?', options: ['Golden Ball', 'Ballon d\'Or', 'Player of the Match', 'World Cup Star'], answer: 'Golden Ball', explanation: 'The Golden Ball is awarded to the tournament\'s best player.' },
  { question: 'How many times has Spain won the UEFA European Championship?', options: ['1', '2', '3', '4'], answer: '4', explanation: 'Spain won in 1964, 2008, 2012, and 2024.' },
  { question: 'Which team has won the most Copa América titles?', options: ['Argentina', 'Brazil', 'Uruguay', 'Paraguay'], answer: 'Argentina', explanation: 'Argentina hold the Copa América record with 16 titles, including their 2021 victory.' },
  { question: 'Which country has won the FIFA World Cup the most times?', options: ['Germany', 'France', 'Brazil', 'Argentina'], answer: 'Brazil', explanation: 'Brazil has won the World Cup a record 5 times.' },
  { question: 'What is the name of the South American club championship?', options: ['Copa Libertadores', 'Copa América', 'South American Cup', 'Sudamericana'], answer: 'Copa Libertadores', explanation: 'The Copa Libertadores is the top club competition in South America.' },
  { question: 'Which club has won the most Copa Libertadores titles?', options: ['Peñarol', 'Independiente', 'Boca Juniors', 'River Plate'], answer: 'Independiente', explanation: 'Independiente of Argentina have won the Copa Libertadores a record 7 times.' },
  { question: 'How many times has Germany won the FIFA World Cup?', options: ['3', '4', '5', '6'], answer: '4', explanation: 'Germany has won the World Cup 4 times (1954, 1974, 1990, 2014).' },
  { question: 'Which trophy is awarded to the top scorer at the FIFA World Cup?', options: ['Golden Boot', 'Golden Ball', 'Bronze Boot', 'Silver Shoe'], answer: 'Golden Boot', explanation: 'The Golden Boot is awarded to the top goal scorer at the World Cup.' },
  { question: 'How many times has France won the FIFA World Cup?', options: ['1', '2', '3', '4'], answer: '2', explanation: 'France won the World Cup in 1998 and 2018.' },
  { question: 'How many players are on the field for one team?', options: ['9', '10', '11', '12'], answer: '11', explanation: 'Football is played with 11 players per side.' },
  { question: 'How long is a standard football match?', options: ['80 minutes', '90 minutes', '100 minutes', '75 minutes'], answer: '90 minutes', explanation: 'A match consists of two 45-minute halves.' },
  { question: 'What does a yellow card signify in football?', options: ['Free kick', 'Caution/Warning', 'Goal kick', 'Throw-in'], answer: 'Caution/Warning', explanation: 'A yellow card is issued as a caution for misconduct.' },
  { question: 'How many substitutes can a team make in a standard match?', options: ['2', '3', '5', '7'], answer: '5', explanation: 'FIFA rules allow teams to make up to 5 substitutions in a standard match.' },
  { question: 'What is the penalty for a deliberate handball in the penalty area?', options: ['Free kick', 'Corner kick', 'Penalty kick', 'Yellow card'], answer: 'Penalty kick', explanation: 'A deliberate handball in the penalty area results in a penalty kick.' },
  { question: 'What is VAR (Video Assistant Referee) used for?', options: ['Attacking decisions only', 'Defensive plays only', 'Clear and obvious errors', 'Every decision'], answer: 'Clear and obvious errors', explanation: 'VAR is used to review and correct clear and obvious errors on the field.' },
  { question: 'What does a red card mean in football?', options: ['Warning', 'Dismissal', 'Penalty', 'Foul'], answer: 'Dismissal', explanation: 'A red card results in the player\'s immediate expulsion from the match.' },
  { question: 'How much of the ball must cross the goal line for a goal to count?', options: ['Half', 'Whole ball', 'Part of it', 'Top curve'], answer: 'Whole ball', explanation: 'The entire ball must completely cross the goal line for a goal to be awarded.' },
  { question: 'What is an offside position in football?', options: ['Standing too close to opponent', 'Nearer to goal than both ball and second-to-last opponent', 'Standing on sidelines', 'In goalkeeper\'s area'], answer: 'Nearer to goal than both ball and second-to-last opponent', explanation: 'A player is in an offside position if they are nearer to the opponent\'s goal line than both the ball and the second-to-last opponent.' },
  { question: 'How long is each halftime break in a standard match?', options: ['10 minutes', '15 minutes', '20 minutes', '25 minutes'], answer: '15 minutes', explanation: 'Halftime lasts 15 minutes between the two halves.' },
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
