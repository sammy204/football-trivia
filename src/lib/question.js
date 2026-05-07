// ─── FOOTBALL QUESTIONS ───────────────────────────────────────────────  // World Cup
const FOOTBALL_WORLD_CUP = [
  { question: 'Which country won the FIFA World Cup in 2018?', options: ['Brazil', 'France', 'Germany', 'Croatia'], answer: 'France', explanation: 'France defeated Croatia 4-2 in the 2018 final.' },
  { question: 'Which country won the FIFA World Cup in 2022?', options: ['Argentina', 'France', 'Germany', 'Brazil'], answer: 'Argentina', explanation: 'Argentina won their third World Cup title in Qatar.' },
  { question: 'In which year was the first FIFA World Cup held?', options: ['1930', '1950', '1922', '1940'], answer: '1930', explanation: 'The first FIFA World Cup was held in Uruguay in 1930.' },
  { question: 'In which year did England win the FIFA World Cup?', options: ['1966', '1970', '1974', '1978'], answer: '1966', explanation: 'England won their only World Cup in 1966 on home soil.' },
  { question: 'Which nation won the first FIFA World Cup held in Asia?', options: ['South Korea', 'Japan', 'Brazil', 'Germany'], answer: 'Brazil', explanation: 'The 2002 World Cup was hosted jointly by South Korea and Japan, but Brazil won the tournament.' },
  { question: 'Who won the Golden Ball at the 2014 FIFA World Cup?', options: ['Cristiano Ronaldo', 'Mario Götze', 'Lionel Messi', 'David Luiz'], answer: 'Lionel Messi', explanation: 'Messi won the award despite Argentina losing in the final.' },
  { question: 'Which country has won the FIFA World Cup the most times?', options: ['Germany', 'France', 'Brazil', 'Argentina'], answer: 'Brazil', explanation: 'Brazil has won the World Cup a record 5 times.' },
  { question: 'How many times has Germany won the FIFA World Cup?', options: ['3', '4', '5', '6'], answer: '4', explanation: 'Germany has won the World Cup 4 times (1954, 1974, 1990, 2014).' },
  { question: 'How many times has France won the FIFA World Cup?', options: ['1', '2', '3', '4'], answer: '2', explanation: 'France won the World Cup in 1998 and 2018.' },
  { question: 'Which African country reached the semi-finals of the 2022 World Cup?', options: ['Nigeria', 'Senegal', 'Morocco', 'Cameroon'], answer: 'Morocco', explanation: 'Morocco made history by becoming the first African nation to reach the World Cup semi-finals in 2022.' },
  { question: 'Who scored the winning goal in the 2010 World Cup final?', options: ['David Villa', 'Fernando Torres', 'Andrés Iniesta', 'Xavi'], answer: 'Andrés Iniesta', explanation: 'Iniesta scored in extra time to give Spain a 1-0 victory over the Netherlands.' },
  { question: 'Who was the manager of Brazil when they won the 2002 World Cup?', options: ['Pelé', 'Luiz Felipe Scolari', 'Carlos Alberto Parreira', 'Tele Santana'], answer: 'Luiz Felipe Scolari', explanation: 'Scolari led Brazil to their fifth World Cup title.' },
  { question: 'Which country hosted the 2016 Olympics football tournament?', options: ['Russia', 'Brazil', 'China', 'Australia'], answer: 'Brazil', explanation: 'Brazil hosted the 2016 Summer Olympics.' },
  { question: 'Who scored the "Hand of God" goal?', options: ['Pelé', 'Ronaldo', 'Diego Maradona', 'Zinedine Zidane'], answer: 'Diego Maradona', explanation: 'Maradona scored the infamous Hand of God goal against England in the 1986 World Cup quarter-final.' },
  { question: 'Which trophy is awarded to the top scorer at the FIFA World Cup?', options: ['Golden Boot', 'Golden Ball', 'Bronze Boot', 'Silver Shoe'], answer: 'Golden Boot', explanation: 'The Golden Boot is awarded to the top goal scorer at the World Cup.' },
  { question: 'Which trophy is awarded to the best player at the FIFA World Cup?', options: ['Golden Ball', 'Ballon d\'Or', 'Player of the Match', 'World Cup Star'], answer: 'Golden Ball', explanation: 'The Golden Ball is awarded to the tournament\'s best player.' },
  // ── NEW ──
  { question: 'Who was the top scorer at the 2022 FIFA World Cup?', options: ['Lionel Messi', 'Kylian Mbappé', 'Olivier Giroud', 'Marcus Rashford'], answer: 'Kylian Mbappé', explanation: 'Mbappé won the Golden Boot with 8 goals at the 2022 World Cup.' },
  { question: 'Which country hosted the 2014 FIFA World Cup?', options: ['Argentina', 'Brazil', 'Colombia', 'Mexico'], answer: 'Brazil', explanation: 'Brazil hosted the 2014 FIFA World Cup.' },
  { question: 'How many goals did Just Fontaine score at the 1958 World Cup, a still-standing record?', options: ['11', '13', '15', '17'], answer: '13', explanation: 'Fontaine scored 13 goals for France at the 1958 World Cup, a record that still stands.' },
  { question: 'Which country beat Germany 7-1 in the 2014 World Cup semi-final?', options: ['Argentina', 'Brazil', 'Netherlands', 'France'], answer: 'Brazil', explanation: 'Germany famously thrashed host nation Brazil 7-1 in the semi-final — known as the Mineirazo.' },
  { question: 'Which World Cup had the tournament\'s first-ever penalty shootout?', options: ['1978', '1982', '1986', '1990'], answer: '1982', explanation: 'The 1982 World Cup in Spain featured the first penalty shootout, between West Germany and France.' },
  { question: 'Who hosted the 2010 FIFA World Cup?', options: ['Nigeria', 'Egypt', 'South Africa', 'Kenya'], answer: 'South Africa', explanation: 'South Africa became the first African nation to host the FIFA World Cup in 2010.' },
  { question: 'Which country did Italy beat in the final to win the 2006 World Cup?', options: ['Brazil', 'Germany', 'France', 'Portugal'], answer: 'France', explanation: 'Italy beat France on penalties in the 2006 World Cup final in Berlin.' },
  { question: 'Who was sent off in the 2006 World Cup final for a headbutt on Marco Materazzi?', options: ['Thierry Henry', 'Patrick Vieira', 'Zinedine Zidane', 'Franck Ribéry'], answer: 'Zinedine Zidane', explanation: 'Zidane was sent off for headbutting Materazzi in his final professional match.' },
  { question: 'Which country won the inaugural FIFA Women\'s World Cup in 1991?', options: ['Germany', 'Norway', 'USA', 'China'], answer: 'USA', explanation: 'The United States won the first FIFA Women\'s World Cup held in China in 1991.' },
  { question: 'Who is the all-time top scorer in FIFA World Cup history?', options: ['Pelé', 'Ronaldo', 'Miroslav Klose', 'Gerd Müller'], answer: 'Miroslav Klose', explanation: 'Miroslav Klose scored 16 World Cup goals across four tournaments for Germany.' },
]

// Players
const FOOTBALL_PLAYERS = [
  { question: 'Which player has won the most Ballon d\'Or awards?', options: ['Lionel Messi', 'Cristiano Ronaldo', 'Johan Cruyff', 'Michel Platini'], answer: 'Lionel Messi', explanation: 'Lionel Messi has won 8 Ballon d\'Or awards.' },
  { question: 'Which player is known as "The King of Football"?', options: ['Diego Maradona', 'Pelé', 'Ronaldinho', 'Gerd Müller'], answer: 'Pelé', explanation: 'Pelé is widely regarded as the King of Football.' },
  { question: 'Who won the Golden Ball at the 2022 FIFA World Cup?', options: ['Lionel Messi', 'Kylian Mbappé', 'Gianluigi Donnarumma', 'Luka Modrić'], answer: 'Lionel Messi', explanation: 'Messi won the Golden Ball award in Qatar.' },
  { question: 'How many international goals has Cristiano Ronaldo scored?', options: ['118', '130', '138', '125'], answer: '138', explanation: 'Ronaldo holds the record as the all-time leading international goal scorer.' },
  { question: 'Which player won the Ballon d\'Or in 1998?', options: ['Zinedine Zidane', 'Ronaldo', 'Davor Šuker', 'Ronaldinho'], answer: 'Zinedine Zidane', explanation: 'Zidane won the 1998 Ballon d\'Or for his outstanding performances, including at the 1998 World Cup.' },
  { question: 'Which female player has won the most FIFA Women\'s World Player of the Year awards?', options: ['Mia Hamm', 'Marta', 'Abby Wambach', 'Megan Rapinoe'], answer: 'Marta', explanation: 'Brazilian Marta has won the award 6 times.' },
  { question: 'How many goals did Gerd Müller score for West Germany?', options: ['62', '68', '74', '78'], answer: '68', explanation: 'Müller is West Germany\'s all-time leading goal scorer with 68 goals.' },
  { question: 'Which player won the 2021 Ballon d\'Or?', options: ['Cristiano Ronaldo', 'Lionel Messi', 'Robert Lewandowski', 'Kylian Mbappé'], answer: 'Lionel Messi', explanation: 'Messi won his 7th Ballon d\'Or in 2021.' },
  { question: 'Who is the all-time top scorer in Premier League history?', options: ['Wayne Rooney', 'Alan Shearer', 'Andrew Cole', 'Frank Lampard'], answer: 'Alan Shearer', explanation: 'Alan Shearer holds the Premier League record with 260 goals.' },
  { question: 'Which player scored 5 goals in a single Premier League match?', options: ['Mohamed Salah', 'Sergio Aguero', 'Harry Kane', 'Riyad Mahrez'], answer: 'Sergio Aguero', explanation: 'Aguero scored 5 for Manchester City against Newcastle in 2015.' },
  { question: 'Which player is known as CR7?', options: ['Carlos Riquelme', 'Cristiano Ronaldo', 'Carlos Ruiz', 'César Rodríguez'], answer: 'Cristiano Ronaldo', explanation: 'CR7 stands for Cristiano Ronaldo, his initials and shirt number.' },
  { question: 'Which club did Ronaldinho play for in his prime?', options: ['Real Madrid', 'Barcelona', 'PSG', 'AC Milan'], answer: 'Barcelona', explanation: 'Ronaldinho was at his peak during his time at Barcelona from 2003 to 2008.' },
  { question: 'What nationality is Robert Lewandowski?', options: ['German', 'Czech', 'Polish', 'Austrian'], answer: 'Polish', explanation: 'Robert Lewandowski is Polish and captains the Polish national team.' },
  { question: 'Which country does Sadio Mané represent?', options: ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast'], answer: 'Senegal', explanation: 'Sadio Mané plays for the Senegalese national team.' },
  { question: 'Who won the 2023 Ballon d\'Or?', options: ['Kylian Mbappé', 'Erling Haaland', 'Lionel Messi', 'Vinicius Jr'], answer: 'Lionel Messi', explanation: 'Messi won his 8th Ballon d\'Or in 2023 after winning the World Cup with Argentina.' },
  // ── NEW ──
  { question: 'Which player is nicknamed "La Pulga" (The Flea)?', options: ['Cristiano Ronaldo', 'Neymar', 'Lionel Messi', 'Luka Modrić'], answer: 'Lionel Messi', explanation: 'Messi earned the nickname "La Pulga" due to his small stature and quick dribbling.' },
  { question: 'Who won the 2024 Ballon d\'Or?', options: ['Vinicius Jr', 'Erling Haaland', 'Rodri', 'Kylian Mbappé'], answer: 'Rodri', explanation: 'Manchester City midfielder Rodri won the 2024 Ballon d\'Or.' },
  { question: 'Which country does Mohamed Salah represent?', options: ['Tunisia', 'Morocco', 'Egypt', 'Algeria'], answer: 'Egypt', explanation: 'Mohamed Salah is the captain of the Egyptian national football team.' },
  { question: 'Which player scored the fastest hat-trick in Premier League history (2 minutes 56 seconds)?', options: ['Sergio Aguero', 'Robbie Fowler', 'Sadio Mané', 'Harry Kane'], answer: 'Sadio Mané', explanation: 'Sadio Mané scored the fastest Premier League hat-trick for Southampton against Aston Villa in 2015.' },
  { question: 'How many goals did Ronaldo (R9) score at the 2002 World Cup?', options: ['6', '7', '8', '9'], answer: '8', explanation: 'Ronaldo scored 8 goals at the 2002 World Cup, winning the Golden Boot.' },
  { question: 'Which club did Thierry Henry spend most of his career at?', options: ['Juventus', 'Barcelona', 'Arsenal', 'Monaco'], answer: 'Arsenal', explanation: 'Thierry Henry is Arsenal\'s all-time top scorer with 228 goals.' },
  { question: 'Which country does Luka Modrić represent?', options: ['Serbia', 'Slovenia', 'Croatia', 'Bosnia'], answer: 'Croatia', explanation: 'Luka Modrić is captain of the Croatian national team.' },
  { question: 'Who is the all-time leading scorer for the Brazilian national team?', options: ['Ronaldo', 'Pelé', 'Neymar', 'Romário'], answer: 'Neymar', explanation: 'Neymar surpassed Pelé\'s record and is Brazil\'s all-time top scorer.' },
  { question: 'Which player scored a famous bicycle kick in the 2018 Champions League final?', options: ['Cristiano Ronaldo', 'Gareth Bale', 'Karim Benzema', 'Marco Asensio'], answer: 'Gareth Bale', explanation: 'Bale scored a stunning bicycle kick for Real Madrid in the 2018 Champions League final against Liverpool.' },
  { question: 'Who was awarded the 2022 FIFA Best Men\'s Player award?', options: ['Erling Haaland', 'Kylian Mbappé', 'Lionel Messi', 'Karim Benzema'], answer: 'Lionel Messi', explanation: 'Messi won the FIFA Best Men\'s Player award in 2022 following his World Cup triumph.' },
]

// Clubs
const FOOTBALL_CLUBS = [
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
  { question: 'Which team won the first ever European Cup in 1956?', options: ['Real Madrid', 'AC Milan', 'Manchester United', 'Eintracht Frankfurt'], answer: 'Real Madrid', explanation: 'Real Madrid beat Reims 4-3 in Paris.' },
  { question: 'Which country won the UEFA Euro 2020 championship?', options: ['Italy', 'England', 'Denmark', 'Spain'], answer: 'Italy', explanation: 'Italy defeated England on penalties in the final.' },
  { question: 'How many times has Spain won the UEFA European Championship?', options: ['1', '2', '3', '4'], answer: '4', explanation: 'Spain won in 1964, 2008, 2012, and 2024.' },
  { question: 'How many times has Liverpool won the UEFA Champions League?', options: ['4', '5', '6', '7'], answer: '6', explanation: 'Liverpool have won the Champions League 6 times.' },
  { question: 'Which team won the 2019 UEFA Champions League?', options: ['Manchester City', 'Juventus', 'Liverpool', 'Ajax'], answer: 'Liverpool', explanation: 'Liverpool defeated Tottenham Hotspur 2-0 in the 2019 Champions League final.' },
  { question: 'Which club does Erling Haaland play for?', options: ['Borussia Dortmund', 'Manchester City', 'Real Madrid', 'Bayern Munich'], answer: 'Manchester City', explanation: 'Erling Haaland joined Manchester City from Borussia Dortmund in 2022.' },
  // ── NEW ──
  { question: 'Which club is nicknamed "The Gunners"?', options: ['Chelsea', 'Arsenal', 'Tottenham', 'West Ham'], answer: 'Arsenal', explanation: 'Arsenal are nicknamed The Gunners, a nod to the club\'s origins near a munitions factory.' },
  { question: 'Which club won the UEFA Champions League in 2024?', options: ['Bayern Munich', 'Arsenal', 'Real Madrid', 'PSG'], answer: 'Real Madrid', explanation: 'Real Madrid beat Borussia Dortmund 2-0 in the 2024 Champions League final at Wembley.' },
  { question: 'Which German club is nicknamed "Der Rekordmeister" (The Record Champions)?', options: ['Borussia Dortmund', 'Bayer Leverkusen', 'Bayern Munich', 'RB Leipzig'], answer: 'Bayern Munich', explanation: 'Bayern Munich are called Der Rekordmeister as the most decorated club in German football.' },
  { question: 'Which club did Pep Guardiola manage before Manchester City?', options: ['Barcelona', 'Bayern Munich', 'Juventus', 'PSG'], answer: 'Bayern Munich', explanation: 'Guardiola managed Bayern Munich from 2013 to 2016 after leaving Barcelona.' },
  { question: 'Which Premier League club plays their home games at Stamford Bridge?', options: ['Arsenal', 'Chelsea', 'Tottenham', 'Fulham'], answer: 'Chelsea', explanation: 'Chelsea FC plays their home matches at Stamford Bridge in west London.' },
  { question: 'Which club did Zinedine Zidane manage to win three consecutive Champions League titles?', options: ['Barcelona', 'Juventus', 'PSG', 'Real Madrid'], answer: 'Real Madrid', explanation: 'Zidane guided Real Madrid to three successive Champions League trophies from 2016 to 2018.' },
  { question: 'Which club is known as "The Old Lady" of Italian football?', options: ['AC Milan', 'Inter Milan', 'Roma', 'Juventus'], answer: 'Juventus', explanation: 'Juventus are nicknamed "La Vecchia Signora" (The Old Lady) in Italy.' },
  { question: 'Which English club won the treble (Premier League, FA Cup, Champions League) in 1999?', options: ['Chelsea', 'Arsenal', 'Manchester United', 'Liverpool'], answer: 'Manchester United', explanation: 'Manchester United won an historic treble in the 1998-99 season under Sir Alex Ferguson.' },
  { question: 'Which club has won the most Bundesliga titles?', options: ['Borussia Dortmund', 'Bayer Leverkusen', 'Bayern Munich', 'Schalke'], answer: 'Bayern Munich', explanation: 'Bayern Munich have dominated the Bundesliga with the most title wins.' },
  { question: 'Which French club did Kylian Mbappé leave to join Real Madrid in 2024?', options: ['Monaco', 'Lyon', 'PSG', 'Marseille'], answer: 'PSG', explanation: 'Mbappé left Paris Saint-Germain on a free transfer to join Real Madrid in 2024.' },
]

// Transfers
const FOOTBALL_TRANSFERS = [
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
  // ── NEW ──
  { question: 'Which club did Jack Grealish join in 2021 for a then-British record fee of £100m?', options: ['Chelsea', 'Manchester City', 'Liverpool', 'Arsenal'], answer: 'Manchester City', explanation: 'Manchester City signed Jack Grealish from Aston Villa for £100m in 2021.' },
  { question: 'Which club did Romelu Lukaku return to on loan from Chelsea in 2022?', options: ['Manchester United', 'Everton', 'Inter Milan', 'Juventus'], answer: 'Inter Milan', explanation: 'Lukaku returned to Inter Milan on loan from Chelsea just one season after leaving the Italian club.' },
  { question: 'Which club signed Erling Haaland from Borussia Dortmund in 2022?', options: ['Real Madrid', 'Bayern Munich', 'Manchester City', 'PSG'], answer: 'Manchester City', explanation: 'Manchester City activated Haaland\'s release clause of around €60m to sign him from Dortmund.' },
  { question: 'Which club did Luis Suárez join after leaving Liverpool in 2014?', options: ['Real Madrid', 'Juventus', 'Barcelona', 'PSG'], answer: 'Barcelona', explanation: 'Luis Suárez joined Barcelona from Liverpool for around €82m following his 2014 World Cup ban.' },
  { question: 'Which club signed Jude Bellingham in the summer of 2023?', options: ['Manchester City', 'Bayern Munich', 'Liverpool', 'Real Madrid'], answer: 'Real Madrid', explanation: 'Real Madrid signed Jude Bellingham from Borussia Dortmund for around €103m in 2023.' },
  { question: 'What was the world record transfer fee paid for Neymar in 2017?', options: ['€150m', '€180m', '€200m', '€222m'], answer: '€222m', explanation: 'PSG paid Barcelona a world record €222m to sign Neymar in 2017, a record that still stands.' },
  { question: 'Which club did Kaká join for a then-world record fee in 2009?', options: ['Chelsea', 'Manchester City', 'Real Madrid', 'Barcelona'], answer: 'Real Madrid', explanation: 'Real Madrid paid AC Milan around €65m for Kaká in 2009, a world record at the time.' },
  { question: 'Which English club did Mohamed Salah join in 2017?', options: ['Chelsea', 'Arsenal', 'Liverpool', 'Manchester United'], answer: 'Liverpool', explanation: 'Mohamed Salah joined Liverpool from AS Roma for around £36.9m in 2017.' },
  { question: 'Which club did Virgil van Dijk join Liverpool from in January 2018?', options: ['Sunderland', 'Southampton', 'Celtic', 'PSV Eindhoven'], answer: 'Southampton', explanation: 'Liverpool signed Virgil van Dijk from Southampton for £75m, a then-world record for a defender.' },
  { question: 'Which club did Cristiano Ronaldo leave to join Juventus in 2018?', options: ['Manchester United', 'Sporting CP', 'Real Madrid', 'PSG'], answer: 'Real Madrid', explanation: 'Ronaldo joined Juventus from Real Madrid for €100m in the summer of 2018.' },
]

// Trophies & Rules
const FOOTBALL_RULES = [
  { question: 'Which football trophy is nicknamed the "Big Ears"?', options: ['FA Cup', 'UEFA Europa League', 'UEFA Champions League', 'Copa del Rey'], answer: 'UEFA Champions League', explanation: 'The Champions League trophy is often called Big Ears due to its distinctive handles.' },
  { question: 'Which team has won the most Copa América titles?', options: ['Argentina', 'Brazil', 'Uruguay', 'Paraguay'], answer: 'Argentina', explanation: 'Argentina hold the Copa América record with 16 titles, including their 2021 victory.' },
  { question: 'What is the name of the South American club championship?', options: ['Copa Libertadores', 'Copa América', 'South American Cup', 'Sudamericana'], answer: 'Copa Libertadores', explanation: 'The Copa Libertadores is the top club competition in South America.' },
  { question: 'Which club has won the most Copa Libertadores titles?', options: ['Peñarol', 'Independiente', 'Boca Juniors', 'River Plate'], answer: 'Independiente', explanation: 'Independiente of Argentina have won the Copa Libertadores a record 7 times.' },
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
  { question: 'In what country is the La Liga football league based?', options: ['Italy', 'France', 'Spain', 'Portugal'], answer: 'Spain', explanation: 'La Liga is the top professional football division in Spain.' },
  // ── NEW ──
  { question: 'What is the distance from the penalty spot to the goal line?', options: ['10 yards', '11 yards', '12 yards', '15 yards'], answer: '12 yards', explanation: 'The penalty spot is placed 12 yards (approximately 11 metres) from the goal line.' },
  { question: 'How many minutes of added time does the fourth official typically display?', options: ['It varies based on stoppages', '3 minutes always', '5 minutes always', '2 minutes always'], answer: 'It varies based on stoppages', explanation: 'Added time is calculated based on time lost through stoppages such as injuries, substitutions and VAR checks.' },
  { question: 'What happens if a goalkeeper saves a penalty but is off their line at the moment of the kick?', options: ['Goal is given', 'Penalty is retaken', 'Corner kick is awarded', 'Free kick to attacking team'], answer: 'Penalty is retaken', explanation: 'If the goalkeeper moves off the line before the penalty is struck and saves it, the kick must be retaken.' },
  { question: 'What is the minimum number of players a team can have on the pitch before the referee abandons the match?', options: ['5', '6', '7', '8'], answer: '7', explanation: 'A match is abandoned if a team has fewer than 7 players remaining on the pitch.' },
  { question: 'In football, what does the acronym IFAB stand for?', options: ['International Federation of Amateur Ball', 'International Football Association Board', 'Integrated Football Authority Board', 'International Football Administration Bureau'], answer: 'International Football Association Board', explanation: 'IFAB is the body responsible for determining and maintaining the Laws of the Game.' },
  { question: 'What is the diameter of a standard football goal post?', options: ['3 inches', '4 inches', '5 inches', '6 inches'], answer: '5 inches', explanation: 'According to FIFA rules, goalposts must not exceed 5 inches (12 cm) in diameter.' },
  { question: 'How wide is a standard football goal?', options: ['6 yards', '7 yards', '8 yards', '9 yards'], answer: '8 yards', explanation: 'A standard football goal is 8 yards (7.32 metres) wide.' },
  { question: 'What does a corner kick replace?', options: ['A goal kick', 'A throw-in', 'A free kick', 'A penalty'], answer: 'A goal kick', explanation: 'A corner kick is awarded to the attacking team when the defending team puts the ball behind their own goal line.' },
  { question: 'In which competition is the AFCON trophy awarded?', options: ['Africa Cup of Nations', 'African Football Championship', 'All African Nations Cup', 'African Continental Trophy'], answer: 'Africa Cup of Nations', explanation: 'AFCON stands for the Africa Cup of Nations, the premier international football competition in Africa.' },
  { question: 'How many times has Nigeria won the Africa Cup of Nations?', options: ['1', '2', '3', '4'], answer: '3', explanation: 'Nigeria have won the Africa Cup of Nations three times: in 1980, 1994, and 2013.' },
]

// ─── BASKETBALL QUESTIONS ─────────────────────────────────────────────

// NBA History & Championships
const BASKETBALL_HISTORY = [
  { question: 'Which NBA team has won the most championships?', options: ['Los Angeles Lakers', 'Boston Celtics', 'Chicago Bulls', 'Golden State Warriors'], answer: 'Boston Celtics', explanation: 'The Boston Celtics have won 17 NBA championships.' },
  { question: 'In which year was the NBA founded?', options: ['1940', '1946', '1950', '1955'], answer: '1946', explanation: 'The NBA was founded on June 6, 1946, as the Basketball Association of America.' },
  { question: 'Which team won the NBA championship in 2023?', options: ['Boston Celtics', 'Golden State Warriors', 'Denver Nuggets', 'Miami Heat'], answer: 'Denver Nuggets', explanation: 'The Denver Nuggets won their first NBA championship in 2023, led by Nikola Jokić.' },
  { question: 'Which team won the NBA championship in 2016?', options: ['Golden State Warriors', 'Cleveland Cavaliers', 'Oklahoma City Thunder', 'Toronto Raptors'], answer: 'Cleveland Cavaliers', explanation: 'The Cavaliers came back from 3-1 down to beat the Golden State Warriors in 2016.' },
  { question: 'Which country does basketball originate from?', options: ['USA', 'Canada', 'UK', 'Brazil'], answer: 'Canada', explanation: 'Basketball was invented by Canadian Dr. James Naismith in 1891.' },
  { question: 'Which country won the 2019 FIBA Basketball World Cup?', options: ['USA', 'Spain', 'Australia', 'France'], answer: 'Spain', explanation: 'Spain defeated Argentina in the final to win the 2019 FIBA Basketball World Cup.' },
  { question: 'Which country won the first FIBA Basketball World Cup in 1950?', options: ['USA', 'Brazil', 'Argentina', 'France'], answer: 'Argentina', explanation: 'Argentina won the inaugural FIBA Basketball World Cup in 1950.' },
  { question: 'What is the name of the trophy awarded to the NBA champion?', options: ['The Golden Trophy', 'Larry O\'Brien Championship Trophy', 'The NBA Cup', 'Bill Russell Trophy'], answer: 'Larry O\'Brien Championship Trophy', explanation: 'The Larry O\'Brien Championship Trophy is awarded to the NBA champion each year.' },
  { question: 'Who coached the Chicago Bulls during their 1990s dynasty?', options: ['Pat Riley', 'Phil Jackson', 'Larry Bird', 'Chuck Daly'], answer: 'Phil Jackson', explanation: 'Phil Jackson coached the Chicago Bulls to 6 championships in the 1990s.' },
  { question: 'Which team has appeared in the most NBA Finals?', options: ['Chicago Bulls', 'Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors'], answer: 'Los Angeles Lakers', explanation: 'The Los Angeles Lakers have appeared in the NBA Finals more times than any other team.' },
  // ── NEW ──
  { question: 'Which team won the NBA championship in 2024?', options: ['Miami Heat', 'Oklahoma City Thunder', 'Boston Celtics', 'Denver Nuggets'], answer: 'Boston Celtics', explanation: 'The Boston Celtics defeated the Dallas Mavericks in the 2024 NBA Finals to win their 18th title.' },
  { question: 'Which team became the first Canadian franchise to win the NBA championship?', options: ['Vancouver Grizzlies', 'Toronto Raptors', 'Ottawa Senators', 'Montreal Royals'], answer: 'Toronto Raptors', explanation: 'The Toronto Raptors won their first and only NBA title in 2019, defeating the Golden State Warriors.' },
  { question: 'In which city was basketball invented in 1891?', options: ['Boston', 'New York', 'Springfield', 'Chicago'], answer: 'Springfield', explanation: 'Dr. James Naismith invented basketball in Springfield, Massachusetts in 1891.' },
  { question: 'How many times did the Golden State Warriors win the NBA championship between 2015 and 2022?', options: ['2', '3', '4', '5'], answer: '4', explanation: 'The Warriors won NBA titles in 2015, 2017, 2018, and 2022.' },
  { question: 'Which team did LeBron James lead to the 2016 NBA title, coming back from 3-1 down?', options: ['Miami Heat', 'Los Angeles Lakers', 'Cleveland Cavaliers', 'Boston Celtics'], answer: 'Cleveland Cavaliers', explanation: 'LeBron James led the Cavaliers to a historic comeback victory over the Golden State Warriors in 2016.' },
  { question: 'Who won the NBA Finals MVP in 2016?', options: ['Kyrie Irving', 'Kevin Love', 'LeBron James', 'Stephen Curry'], answer: 'LeBron James', explanation: 'LeBron James won the Finals MVP after delivering a historic performance, including a legendary chase-down block.' },
  { question: 'Which NBA team moved from Seattle to Oklahoma City in 2008?', options: ['New Jersey Nets', 'Seattle SuperSonics', 'Vancouver Grizzlies', 'New Orleans Hornets'], answer: 'Seattle SuperSonics', explanation: 'The Seattle SuperSonics relocated to Oklahoma City and became the Oklahoma City Thunder in 2008.' },
  { question: 'How many NBA championships did the San Antonio Spurs win between 1999 and 2014?', options: ['3', '4', '5', '6'], answer: '5', explanation: 'The Spurs won five championships in 1999, 2003, 2005, 2007, and 2014.' },
  { question: 'Which legendary coach led the Los Angeles Lakers to 5 NBA titles?', options: ['Red Auerbach', 'Doc Rivers', 'Phil Jackson', 'Pat Riley'], answer: 'Phil Jackson', explanation: 'Phil Jackson won 5 NBA titles with the Lakers (2000, 2001, 2002, 2009, 2010), adding to his 6 with Chicago.' },
  { question: 'What year did the NBA introduce the three-point line?', options: ['1976', '1979', '1984', '1990'], answer: '1979', explanation: 'The NBA introduced the three-point line at the start of the 1979-80 season.' },
]

// Players
const BASKETBALL_PLAYERS = [
  { question: 'Which player is known as "The Black Mamba"?', options: ['LeBron James', 'Shaquille O\'Neal', 'Kobe Bryant', 'Dwyane Wade'], answer: 'Kobe Bryant', explanation: 'Kobe Bryant gave himself the nickname "Black Mamba".' },
  { question: 'Which player has won the most NBA MVP awards?', options: ['LeBron James', 'Michael Jordan', 'Kareem Abdul-Jabbar', 'Bill Russell'], answer: 'Kareem Abdul-Jabbar', explanation: 'Kareem Abdul-Jabbar won 6 NBA MVP awards.' },
  { question: 'Which player holds the NBA all-time scoring record?', options: ['Michael Jordan', 'Kobe Bryant', 'LeBron James', 'Kareem Abdul-Jabbar'], answer: 'LeBron James', explanation: 'LeBron James surpassed Kareem Abdul-Jabbar\'s record in February 2023.' },
  { question: 'Who holds the record for most three-pointers made in NBA history?', options: ['Ray Allen', 'Stephen Curry', 'Reggie Miller', 'Klay Thompson'], answer: 'Stephen Curry', explanation: 'Stephen Curry holds the all-time record for most three-pointers made.' },
  { question: 'Which player holds the record for most assists in NBA history?', options: ['Magic Johnson', 'John Stockton', 'Steve Nash', 'Chris Paul'], answer: 'John Stockton', explanation: 'John Stockton holds the all-time NBA record with 15,806 assists.' },
  { question: 'Who holds the record for the most points scored in a single NBA game?', options: ['Michael Jordan', 'Kobe Bryant', 'Wilt Chamberlain', 'LeBron James'], answer: 'Wilt Chamberlain', explanation: 'Wilt Chamberlain scored 100 points for the Philadelphia Warriors in 1962.' },
  { question: 'Who scored 81 points in a single NBA game in 2006?', options: ['LeBron James', 'Michael Jordan', 'Kobe Bryant', 'Shaquille O\'Neal'], answer: 'Kobe Bryant', explanation: 'Kobe Bryant scored 81 points against the Toronto Raptors on January 22, 2006.' },
  { question: 'Which player is nicknamed "The Greek Freak"?', options: ['Nikola Jokić', 'Luka Dončić', 'Giannis Antetokounmpo', 'Rudy Gobert'], answer: 'Giannis Antetokounmpo', explanation: 'Giannis Antetokounmpo earned the nickname due to his Greek heritage and freakish athleticism.' },
  { question: 'Which player is nicknamed "The Beard"?', options: ['LeBron James', 'James Harden', 'Russell Westbrook', 'Paul George'], answer: 'James Harden', explanation: 'James Harden is nicknamed "The Beard" due to his distinctive facial hair.' },
  { question: 'Which player is known as "The Mailman"?', options: ['Charles Barkley', 'Karl Malone', 'Patrick Ewing', 'John Stockton'], answer: 'Karl Malone', explanation: 'Karl Malone earned the nickname "The Mailman" because he always delivered.' },
  { question: 'Which player is nicknamed "King James"?', options: ['Kevin Durant', 'LeBron James', 'Dwyane Wade', 'Chris Paul'], answer: 'LeBron James', explanation: 'LeBron James is nicknamed "King James" due to his dominance in the sport.' },
  { question: 'Which player is known as "The Slim Reaper"?', options: ['Kevin Durant', 'Kawhi Leonard', 'Paul George', 'Jimmy Butler'], answer: 'Kevin Durant', explanation: 'Kevin Durant earned the nickname due to his tall, slender build and lethal scoring ability.' },
  { question: 'Which player won the NBA Finals MVP in 2023?', options: ['Jamal Murray', 'Nikola Jokić', 'Aaron Gordon', 'Michael Porter Jr'], answer: 'Nikola Jokić', explanation: 'Nikola Jokić won the Finals MVP as the Denver Nuggets claimed their first title.' },
  { question: 'Which team did Kobe Bryant play his entire career with?', options: ['Chicago Bulls', 'Miami Heat', 'Los Angeles Lakers', 'Orlando Magic'], answer: 'Los Angeles Lakers', explanation: 'Kobe Bryant spent all 20 seasons of his NBA career with the Los Angeles Lakers.' },
  { question: 'Which player was selected 1st overall in the 2003 NBA Draft?', options: ['Carmelo Anthony', 'Dwyane Wade', 'LeBron James', 'Chris Bosh'], answer: 'LeBron James', explanation: 'LeBron James was selected 1st overall by the Cleveland Cavaliers in the 2003 NBA Draft.' },
  { question: 'Which team drafted Michael Jordan in the 1984 NBA Draft?', options: ['Chicago Bulls', 'Boston Celtics', 'Los Angeles Lakers', 'Portland Trail Blazers'], answer: 'Chicago Bulls', explanation: 'The Chicago Bulls selected Michael Jordan with the 3rd overall pick in the 1984 NBA Draft.' },
  { question: 'How many NBA titles did Michael Jordan win?', options: ['4', '5', '6', '7'], answer: '6', explanation: 'Michael Jordan won 6 NBA championships, all with the Chicago Bulls.' },
  { question: 'Which team did Kevin Durant join in 2016?', options: ['Brooklyn Nets', 'Golden State Warriors', 'Oklahoma City Thunder', 'Phoenix Suns'], answer: 'Golden State Warriors', explanation: 'Kevin Durant joined the Golden State Warriors in 2016, forming a superteam.' },
  { question: 'Which team did LeBron James win his first NBA championship with?', options: ['Cleveland Cavaliers', 'Miami Heat', 'Los Angeles Lakers', 'Boston Celtics'], answer: 'Miami Heat', explanation: 'LeBron James won his first championship with the Miami Heat in 2012.' },
  { question: 'How many rings did Shaquille O\'Neal win in his career?', options: ['2', '3', '4', '5'], answer: '4', explanation: 'Shaquille O\'Neal won 4 NBA championships: three with the Lakers and one with the Heat.' },
  // ── NEW ──
  { question: 'Which player is nicknamed "The Joker"?', options: ['Luka Dončić', 'Joel Embiid', 'Nikola Jokić', 'Domantas Sabonis'], answer: 'Nikola Jokić', explanation: 'Serbian center Nikola Jokić is nicknamed "The Joker" and has won multiple NBA MVP awards.' },
  { question: 'Who was the first overall pick in the 2019 NBA Draft?', options: ['Ja Morant', 'RJ Barrett', 'Zion Williamson', 'Darius Garland'], answer: 'Zion Williamson', explanation: 'Zion Williamson was selected first overall by the New Orleans Pelicans in the 2019 NBA Draft.' },
  { question: 'Which player holds the NBA record for most rebounds in a single game?', options: ['Dennis Rodman', 'Bill Russell', 'Wilt Chamberlain', 'Kareem Abdul-Jabbar'], answer: 'Wilt Chamberlain', explanation: 'Wilt Chamberlain grabbed 55 rebounds in a single NBA game in 1960, a record that still stands.' },
  { question: 'Which guard is nicknamed "Luka Magic"?', options: ['Trae Young', 'Luka Dončić', 'Damian Lillard', 'Donovan Mitchell'], answer: 'Luka Dončić', explanation: 'Slovenian star Luka Dončić is nicknamed "Luka Magic" for his ability to produce clutch moments.' },
  { question: 'Who is the all-time leader in NBA rebounds?', options: ['Bill Russell', 'Wilt Chamberlain', 'Dennis Rodman', 'Kareem Abdul-Jabbar'], answer: 'Wilt Chamberlain', explanation: 'Wilt Chamberlain holds the all-time NBA record with 23,924 rebounds.' },
  { question: 'Which player scored 73 points in a single game to set the NBA regular season record in 2006?', options: ['Kobe Bryant', 'LeBron James', 'Devin Booker', 'David Thompson'], answer: 'Kobe Bryant', explanation: 'Kobe Bryant scored 81 points in a game. The highest individual game score in NBA history was actually 100 by Wilt Chamberlain. Devin Booker holds the Phoenix Suns record with 70.' },
  { question: 'Which team drafted Steph Curry in 2009?', options: ['Oklahoma City Thunder', 'Charlotte Bobcats', 'Golden State Warriors', 'Minnesota Timberwolves'], answer: 'Golden State Warriors', explanation: 'The Golden State Warriors selected Stephen Curry with the 7th pick in the 2009 NBA Draft.' },
  { question: 'Who was Bill Russell\'s primary rival during the Boston Celtics\' dynasty?', options: ['Jerry West', 'Wilt Chamberlain', 'Oscar Robertson', 'Elgin Baylor'], answer: 'Wilt Chamberlain', explanation: 'The rivalry between Bill Russell and Wilt Chamberlain is one of the greatest in NBA history.' },
  { question: 'Which player won the NBA MVP award in both 2019 and 2020?', options: ['LeBron James', 'Nikola Jokić', 'Giannis Antetokounmpo', 'James Harden'], answer: 'Giannis Antetokounmpo', explanation: 'Giannis won back-to-back MVP awards in 2019 and 2020 with the Milwaukee Bucks.' },
  { question: 'Which player was famously traded for three first-round picks and more to the Los Angeles Lakers in 1975?', options: ['Wilt Chamberlain', 'Kareem Abdul-Jabbar', 'Oscar Robertson', 'Jerry West'], answer: 'Kareem Abdul-Jabbar', explanation: 'Kareem Abdul-Jabbar was traded from the Milwaukee Bucks to the Los Angeles Lakers in 1975 in a blockbuster deal.' },
]

// Rules & Facts
const BASKETBALL_RULES = [
  { question: 'How many players are on the court per team in basketball?', options: ['4', '5', '6', '7'], answer: '5', explanation: 'Each team has 5 players on the court at a time.' },
  { question: 'How long is an NBA quarter?', options: ['10 minutes', '12 minutes', '15 minutes', '8 minutes'], answer: '12 minutes', explanation: 'Each NBA quarter lasts 12 minutes.' },
  { question: 'How long is the shot clock in the NBA?', options: ['20 seconds', '24 seconds', '30 seconds', '35 seconds'], answer: '24 seconds', explanation: 'NBA teams have 24 seconds to attempt a shot after gaining possession.' },
  { question: 'How high is an NBA basketball hoop from the ground?', options: ['8 feet', '9 feet', '10 feet', '11 feet'], answer: '10 feet', explanation: 'The NBA basket is 10 feet (3.05 meters) above the floor.' },
  { question: 'How many points is a shot worth if made beyond the three-point line?', options: ['1', '2', '3', '4'], answer: '3', explanation: 'Any shot made from beyond the three-point arc is worth 3 points.' },
  { question: 'How many points is a free throw worth?', options: ['1', '2', '3', '4'], answer: '1', explanation: 'Each successful free throw is worth 1 point.' },
  { question: 'How many fouls does it take to foul out of an NBA game?', options: ['4', '5', '6', '7'], answer: '6', explanation: 'A player fouls out of an NBA game after committing 6 personal fouls.' },
  { question: 'What does NBA stand for?', options: ['National Basketball Association', 'National Basketball Academy', 'North Basketball Alliance', 'National Ball Association'], answer: 'National Basketball Association', explanation: 'NBA stands for the National Basketball Association.' },
  { question: 'What is the three-second rule in basketball?', options: ['Shot clock limit', 'Player cannot stay in the paint for more than 3 seconds', 'Time to inbound the ball', 'Time to shoot a free throw'], answer: 'Player cannot stay in the paint for more than 3 seconds', explanation: 'An offensive player cannot remain in the paint for more than 3 consecutive seconds.' },
  { question: 'What is a "triple-double" in basketball?', options: ['Three consecutive wins', 'Scoring 30+ points three times', 'Reaching double digits in three statistical categories', 'Three three-pointers in a row'], answer: 'Reaching double digits in three statistical categories', explanation: 'A triple-double means a player reaches 10 or more in three stats like points, rebounds, and assists.' },
  { question: 'What is a "double-double" in basketball?', options: ['Scoring twice in overtime', 'Two consecutive wins', 'Reaching double digits in two statistical categories', 'Two three-pointers in a row'], answer: 'Reaching double digits in two statistical categories', explanation: 'A double-double is when a player reaches 10 or more in two statistical categories.' },
  { question: 'What is a "buzzer beater" in basketball?', options: ['A shot made after the buzzer', 'A shot made as time expires', 'A foul called at the end of the game', 'An overtime winner'], answer: 'A shot made as time expires', explanation: 'A buzzer beater is a shot released before the buzzer sounds and counts as time expires.' },
  { question: 'How many quarters are in an NBA game?', options: ['2', '3', '4', '5'], answer: '4', explanation: 'An NBA game consists of 4 quarters, each lasting 12 minutes.' },
  { question: 'What is the length of an NBA basketball court?', options: ['84 feet', '90 feet', '94 feet', '100 feet'], answer: '94 feet', explanation: 'An NBA basketball court is 94 feet (28.65 meters) long.' },
  { question: 'What is the diameter of an NBA basketball hoop?', options: ['16 inches', '18 inches', '20 inches', '22 inches'], answer: '18 inches', explanation: 'The NBA hoop has an inner diameter of 18 inches (45.7 cm).' },
  { question: 'Which NBA team does Stephen Curry play for?', options: ['Los Angeles Lakers', 'Golden State Warriors', 'Phoenix Suns', 'Brooklyn Nets'], answer: 'Golden State Warriors', explanation: 'Stephen Curry has played for the Golden State Warriors his entire career.' },
  { question: 'Which NBA team is based in San Antonio?', options: ['Houston Rockets', 'Dallas Mavericks', 'San Antonio Spurs', 'Oklahoma City Thunder'], answer: 'San Antonio Spurs', explanation: 'The San Antonio Spurs are the NBA franchise based in San Antonio, Texas.' },
  { question: 'Who won the NBA Slam Dunk Contest in 2016?', options: ['LeBron James', 'Zach LaVine', 'Aaron Gordon', 'Vince Carter'], answer: 'Zach LaVine', explanation: 'Zach LaVine won the 2016 NBA Slam Dunk Contest with an outstanding performance.' },
  // ── NEW ──
  { question: 'How many timeouts does each NBA team get per game?', options: ['4', '5', '6', '7'], answer: '7', explanation: 'Each NBA team is allocated 7 timeouts per regulation game.' },
  { question: 'What is a "flagrant foul" in basketball?', options: ['A foul resulting in a free throw', 'Unnecessary or excessive contact against an opponent', 'A foul in the final two minutes', 'A technical foul on a coach'], answer: 'Unnecessary or excessive contact against an opponent', explanation: 'A flagrant foul involves unnecessary or excessive contact and can result in free throws and possession for the opposing team.' },
  { question: 'How long does an NBA overtime period last?', options: ['3 minutes', '5 minutes', '7 minutes', '10 minutes'], answer: '5 minutes', explanation: 'Each NBA overtime period lasts 5 minutes.' },
  { question: 'What is a "pick and roll" in basketball?', options: ['A defensive formation', 'A play where a screener blocks a defender then moves toward the basket', 'A passing drill', 'A type of jump shot'], answer: 'A play where a screener blocks a defender then moves toward the basket', explanation: 'The pick and roll is one of basketball\'s most common offensive plays — a screen is set, then the screener rolls toward the basket.' },
  { question: 'In basketball, what is a "turnover"?', options: ['Switching defensive assignments', 'Losing possession of the ball to the opposing team', 'A backcourt violation', 'A failed inbound pass'], answer: 'Losing possession of the ball to the opposing team', explanation: 'A turnover occurs when the offensive team loses possession through a steal, bad pass, or violation.' },
  { question: 'What does "paint" refer to in basketball?', options: ['The free throw line', 'The key or lane area under the basket', 'The half-court line', 'The three-point arc'], answer: 'The key or lane area under the basket', explanation: 'The "paint" refers to the painted rectangular area under the basket, also called the key or lane.' },
  { question: 'How many players are on a standard NBA roster?', options: ['12', '13', '15', '17'], answer: '15', explanation: 'An NBA roster consists of 15 players, with 13 active on game day.' },
  { question: 'What is a "block" in basketball?', options: ['Setting a screen', 'Legally deflecting an opponent\'s shot attempt', 'A charging foul', 'An illegal pick'], answer: 'Legally deflecting an opponent\'s shot attempt', explanation: 'A block occurs when a defensive player legally deflects a field goal attempt by an offensive player.' },
  { question: 'What is the width of an NBA basketball court?', options: ['44 feet', '50 feet', '54 feet', '60 feet'], answer: '50 feet', explanation: 'An NBA basketball court is 50 feet (15.24 metres) wide.' },
  { question: 'What is a "technical foul" in basketball?', options: ['Excessive physical contact', 'Unsportsmanlike conduct or rule violation not involving physical contact', 'A flagrant hit on a player', 'A foul on a fast break'], answer: 'Unsportsmanlike conduct or rule violation not involving physical contact', explanation: 'A technical foul is called for unsportsmanlike behaviour or certain rule violations not involving direct physical contact.' },
]

// ─── COMBINE ALL QUESTIONS ────────────────────────────────────────────

const FOOTBALL_QUESTIONS = [
  ...FOOTBALL_WORLD_CUP,
  ...FOOTBALL_PLAYERS,
  ...FOOTBALL_CLUBS,
  ...FOOTBALL_TRANSFERS,
  ...FOOTBALL_RULES,
]

const BASKETBALL_QUESTIONS = [
  ...BASKETBALL_HISTORY,
  ...BASKETBALL_PLAYERS,
  ...BASKETBALL_RULES,
]

// ─── SHUFFLE & EXPORT ─────────────────────────────────────────────────

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function generateQuestions({ rounds, sport }) {
  const bank = getQuestionBank(sport)
  return shuffle(bank).slice(0, rounds || 5).map(q => ({ ...q }))
}

export function generateQuestionSets({ sport, setCount, roundsPerSet }) {
  const bank = shuffle(getQuestionBank(sport))
  const safeSetCount = Math.max(0, setCount || 0)
  const safeRoundsPerSet = Math.max(0, roundsPerSet || 0)

  return Array.from({ length: safeSetCount }, (_, setIndex) => (
    Array.from({ length: safeRoundsPerSet }, (_, questionIndex) => {
      const bankIndex = (setIndex * safeRoundsPerSet + questionIndex) % bank.length
      return { ...bank[bankIndex] }
    })
  ))
}

export function generateTieBreakerQuestion({ sport, excludeQuestions = [] }) {
  const bank = getQuestionBank(sport)
  const usedQuestions = new Set(excludeQuestions.map(q => q.question))
  const remaining = bank.filter(q => !usedQuestions.has(q.question))
  if (!remaining.length) return null
  return { ...shuffle(remaining)[0] }
}

export function getQuestionBank(sport) {
  return sport === 'basketball' ? BASKETBALL_QUESTIONS : FOOTBALL_QUESTIONS
}
