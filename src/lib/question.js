const FOOTBALL_QUESTIONS = [
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
  { question: 'Who scored the "Hand of God" goal?', options: ['Pelé', 'Ronaldo', 'Diego Maradona', 'Zinedine Zidane'], answer: 'Diego Maradona', explanation: 'Maradona scored the infamous Hand of God goal against England in the 1986 World Cup quarter-final.' },
  { question: 'Which club did Ronaldinho play for in his prime?', options: ['Real Madrid', 'Barcelona', 'PSG', 'AC Milan'], answer: 'Barcelona', explanation: 'Ronaldinho was at his peak during his time at Barcelona from 2003 to 2008.' },
  { question: 'Who is the all-time top scorer in Premier League history?', options: ['Wayne Rooney', 'Alan Shearer', 'Andrew Cole', 'Frank Lampard'], answer: 'Alan Shearer', explanation: 'Alan Shearer holds the Premier League record with 260 goals.' },
  { question: 'Which country does Sadio Mané represent?', options: ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast'], answer: 'Senegal', explanation: 'Sadio Mané plays for the Senegalese national team.' },
  { question: 'What is the nickname of the Brazilian national team?', options: ['The Eagles', 'The Samba Boys', 'The Selecão', 'The Green Giants'], answer: 'The Selecão', explanation: 'Brazil\'s national team is officially known as A Seleção.' },
  { question: 'Which club does Erling Haaland play for?', options: ['Borussia Dortmund', 'Manchester City', 'Real Madrid', 'Bayern Munich'], answer: 'Manchester City', explanation: 'Erling Haaland joined Manchester City from Borussia Dortmund in 2022.' },
  { question: 'How many times has Liverpool won the UEFA Champions League?', options: ['4', '5', '6', '7'], answer: '6', explanation: 'Liverpool have won the Champions League 6 times.' },
  { question: 'Who won the 2023 Ballon d\'Or?', options: ['Kylian Mbappé', 'Erling Haaland', 'Lionel Messi', 'Vinicius Jr'], answer: 'Lionel Messi', explanation: 'Messi won his 8th Ballon d\'Or in 2023 after winning the World Cup with Argentina.' },
  { question: 'Which club did Thierry Henry play most of his career at?', options: ['Chelsea', 'Arsenal', 'Barcelona', 'Juventus'], answer: 'Arsenal', explanation: 'Thierry Henry is Arsenal\'s all-time top scorer with 228 goals.' },
  { question: 'What nationality is Robert Lewandowski?', options: ['German', 'Czech', 'Polish', 'Austrian'], answer: 'Polish', explanation: 'Robert Lewandowski is Polish and captains the Polish national team.' },
  { question: 'Which team won the 2019 UEFA Champions League?', options: ['Manchester City', 'Juventus', 'Liverpool', 'Ajax'], answer: 'Liverpool', explanation: 'Liverpool defeated Tottenham Hotspur 2-0 in the 2019 Champions League final.' },
  { question: 'How tall is a standard football goal?', options: ['6 feet', '7 feet', '8 feet', '9 feet'], answer: '8 feet', explanation: 'A standard football goal is 8 feet (2.44m) tall and 24 feet (7.32m) wide.' },
  { question: 'Which player is known as CR7?', options: ['Carlos Riquelme', 'Cristiano Ronaldo', 'Carlos Ruiz', 'César Rodríguez'], answer: 'Cristiano Ronaldo', explanation: 'CR7 stands for Cristiano Ronaldo, his initials and shirt number.' },
  { question: 'In what country is the La Liga football league based?', options: ['Italy', 'France', 'Spain', 'Portugal'], answer: 'Spain', explanation: 'La Liga is the top professional football division in Spain.' },
  { question: 'Which player has the most assists in Premier League history?', options: ['David Beckham', 'Ryan Giggs', 'Wayne Rooney', 'Frank Lampard'], answer: 'Ryan Giggs', explanation: 'Ryan Giggs holds the record for most Premier League assists.' },
  { question: 'Which African country reached the semi-finals of the 2022 World Cup?', options: ['Nigeria', 'Senegal', 'Morocco', 'Cameroon'], answer: 'Morocco', explanation: 'Morocco made history by becoming the first African nation to reach the World Cup semi-finals in 2022.' },
  { question: 'Who scored the winning goal in the 2010 World Cup final?', options: ['David Villa', 'Fernando Torres', 'Andrés Iniesta', 'Xavi'], answer: 'Andrés Iniesta', explanation: 'Iniesta scored in extra time to give Spain a 1-0 victory over the Netherlands.' },
]

const BASKETBALL_QUESTIONS = [
  { question: 'Which NBA team has won the most championships?', options: ['Los Angeles Lakers', 'Boston Celtics', 'Chicago Bulls', 'Golden State Warriors'], answer: 'Boston Celtics', explanation: 'The Boston Celtics have won 17 NBA championships.' },
  { question: 'Who holds the record for the most points scored in a single NBA game?', options: ['Michael Jordan', 'Kobe Bryant', 'Wilt Chamberlain', 'LeBron James'], answer: 'Wilt Chamberlain', explanation: 'Wilt Chamberlain scored 100 points for the Philadelphia Warriors against the New York Knicks in 1962.' },
  { question: 'How many players are on the court per team in basketball?', options: ['4', '5', '6', '7'], answer: '5', explanation: 'Each team has 5 players on the court at a time.' },
  { question: 'Which player is known as "The GOAT" in basketball?', options: ['LeBron James', 'Kobe Bryant', 'Michael Jordan', 'Kareem Abdul-Jabbar'], answer: 'Michael Jordan', explanation: 'Michael Jordan is widely considered the greatest basketball player of all time.' },
  { question: 'How long is an NBA quarter?', options: ['10 minutes', '12 minutes', '15 minutes', '8 minutes'], answer: '12 minutes', explanation: 'Each NBA quarter lasts 12 minutes.' },
  { question: 'Which player has won the most NBA MVP awards?', options: ['LeBron James', 'Michael Jordan', 'Kareem Abdul-Jabbar', 'Bill Russell'], answer: 'Kareem Abdul-Jabbar', explanation: 'Kareem Abdul-Jabbar won 6 NBA MVP awards.' },
  { question: 'Which country does basketball originate from?', options: ['USA', 'Canada', 'UK', 'Brazil'], answer: 'Canada', explanation: 'Basketball was invented by Canadian Dr. James Naismith in 1891.' },
  { question: 'What is the three-second rule in basketball?', options: ['Shot clock limit', 'Player cannot stay in the paint for more than 3 seconds', 'Time to inbound the ball', 'Time to shoot a free throw'], answer: 'Player cannot stay in the paint for more than 3 seconds', explanation: 'An offensive player cannot remain in the paint for more than 3 consecutive seconds.' },
  { question: 'Which team did LeBron James win his first NBA championship with?', options: ['Cleveland Cavaliers', 'Miami Heat', 'Los Angeles Lakers', 'Boston Celtics'], answer: 'Miami Heat', explanation: 'LeBron James won his first championship with the Miami Heat in 2012.' },
  { question: 'How high is an NBA basketball hoop from the ground?', options: ['8 feet', '9 feet', '10 feet', '11 feet'], answer: '10 feet', explanation: 'The NBA basket is 10 feet (3.05 meters) above the floor.' },
  { question: 'Who scored 81 points in a single NBA game in 2006?', options: ['LeBron James', 'Michael Jordan', 'Kobe Bryant', 'Shaquille O\'Neal'], answer: 'Kobe Bryant', explanation: 'Kobe Bryant scored 81 points against the Toronto Raptors on January 22, 2006.' },
  { question: 'Which NBA team does Stephen Curry play for?', options: ['Los Angeles Lakers', 'Golden State Warriors', 'Phoenix Suns', 'Brooklyn Nets'], answer: 'Golden State Warriors', explanation: 'Stephen Curry has played for the Golden State Warriors his entire career.' },
  { question: 'What is a "triple-double" in basketball?', options: ['Three consecutive wins', 'Scoring 30+ points three times', 'Reaching double digits in three statistical categories', 'Three three-pointers in a row'], answer: 'Reaching double digits in three statistical categories', explanation: 'A triple-double means a player reaches 10 or more in three stats like points, rebounds, and assists.' },
  { question: 'Which player is known as "The Black Mamba"?', options: ['LeBron James', 'Shaquille O\'Neal', 'Kobe Bryant', 'Dwyane Wade'], answer: 'Kobe Bryant', explanation: 'Kobe Bryant gave himself the nickname "Black Mamba" to separate his fierce on-court persona.' },
  { question: 'How many points is a shot worth if made beyond the three-point line?', options: ['1', '2', '3', '4'], answer: '3', explanation: 'Any shot made from beyond the three-point arc is worth 3 points.' },
  { question: 'Which NBA player is nicknamed "The Greek Freak"?', options: ['Nikola Jokić', 'Luka Dončić', 'Giannis Antetokounmpo', 'Rudy Gobert'], answer: 'Giannis Antetokounmpo', explanation: 'Giannis Antetokounmpo, who plays for the Milwaukee Bucks, earned the nickname due to his Greek heritage and freakish athleticism.' },
  { question: 'Who won the NBA championship in 2023?', options: ['Boston Celtics', 'Golden State Warriors', 'Denver Nuggets', 'Miami Heat'], answer: 'Denver Nuggets', explanation: 'The Denver Nuggets won their first NBA championship in 2023, led by Nikola Jokić.' },
  { question: 'What does NBA stand for?', options: ['National Basketball Association', 'National Basketball Academy', 'North Basketball Alliance', 'National Ball Association'], answer: 'National Basketball Association', explanation: 'NBA stands for the National Basketball Association.' },
  { question: 'Which player holds the NBA all-time scoring record?', options: ['Michael Jordan', 'Kobe Bryant', 'LeBron James', 'Kareem Abdul-Jabbar'], answer: 'LeBron James', explanation: 'LeBron James surpassed Kareem Abdul-Jabbar\'s record in February 2023 to become the all-time leading scorer.' },
  { question: 'How long is the shot clock in the NBA?', options: ['20 seconds', '24 seconds', '30 seconds', '35 seconds'], answer: '24 seconds', explanation: 'NBA teams have 24 seconds to attempt a shot after gaining possession.' },
  { question: 'Which team drafted Michael Jordan in the 1984 NBA Draft?', options: ['Chicago Bulls', 'Boston Celtics', 'Los Angeles Lakers', 'Portland Trail Blazers'], answer: 'Chicago Bulls', explanation: 'The Chicago Bulls selected Michael Jordan with the 3rd overall pick in the 1984 NBA Draft.' },
  { question: 'How many NBA titles did Michael Jordan win?', options: ['4', '5', '6', '7'], answer: '6', explanation: 'Michael Jordan won 6 NBA championships, all with the Chicago Bulls.' },
  { question: 'Which player is known as "The Mailman"?', options: ['Charles Barkley', 'Karl Malone', 'Patrick Ewing', 'John Stockton'], answer: 'Karl Malone', explanation: 'Karl Malone earned the nickname "The Mailman" because he always delivered.' },
  { question: 'What is the diameter of an NBA basketball hoop?', options: ['16 inches', '18 inches', '20 inches', '22 inches'], answer: '18 inches', explanation: 'The NBA hoop has an inner diameter of 18 inches (45.7 cm).' },
  { question: 'Which country won the first FIBA Basketball World Cup in 1950?', options: ['USA', 'Brazil', 'Argentina', 'France'], answer: 'Argentina', explanation: 'Argentina won the inaugural FIBA Basketball World Cup in 1950.' },
  { question: 'How many fouls does it take to foul out of an NBA game?', options: ['4', '5', '6', '7'], answer: '6', explanation: 'A player fouls out of an NBA game after committing 6 personal fouls.' },
  { question: 'Which team has appeared in the most NBA Finals?', options: ['Chicago Bulls', 'Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors'], answer: 'Los Angeles Lakers', explanation: 'The Los Angeles Lakers have appeared in the NBA Finals more times than any other team.' },
  { question: 'Who won the NBA Slam Dunk Contest in 2016?', options: ['LeBron James', 'Zach LaVine', 'Aaron Gordon', 'Vince Carter'], answer: 'Zach LaVine', explanation: 'Zach LaVine won the 2016 NBA Slam Dunk Contest with an outstanding performance.' },
  { question: 'Which player won the NBA MVP award in 2021 and 2022?', options: ['LeBron James', 'Giannis Antetokounmpo', 'Nikola Jokić', 'Joel Embiid'], answer: 'Nikola Jokić', explanation: 'Nikola Jokić won back-to-back MVP awards in 2021 and 2022.' },
  { question: 'What is a "buzzer beater" in basketball?', options: ['A shot made after the buzzer', 'A shot made as time expires', 'A foul called at the end of the game', 'An overtime winner'], answer: 'A shot made as time expires', explanation: 'A buzzer beater is a shot released before the buzzer sounds and counts as time expires.' },
  { question: 'Which NBA team is based in San Antonio?', options: ['Houston Rockets', 'Dallas Mavericks', 'San Antonio Spurs', 'Oklahoma City Thunder'], answer: 'San Antonio Spurs', explanation: 'The San Antonio Spurs are the NBA franchise based in San Antonio, Texas.' },
  { question: 'How many rings did Shaquille O\'Neal win in his career?', options: ['2', '3', '4', '5'], answer: '4', explanation: 'Shaquille O\'Neal won 4 NBA championships: three with the Lakers and one with the Heat.' },
  { question: 'Which player is nicknamed "King James"?', options: ['Kevin Durant', 'LeBron James', 'Dwyane Wade', 'Chris Paul'], answer: 'LeBron James', explanation: 'LeBron James is nicknamed "King James" due to his dominance in the sport.' },
  { question: 'In which year was the NBA founded?', options: ['1940', '1946', '1950', '1955'], answer: '1946', explanation: 'The NBA was founded on June 6, 1946, as the Basketball Association of America.' },
  { question: 'Which player holds the record for most assists in NBA history?', options: ['Magic Johnson', 'John Stockton', 'Steve Nash', 'Chris Paul'], answer: 'John Stockton', explanation: 'John Stockton holds the all-time NBA record with 15,806 assists.' },
  { question: 'How many points is a free throw worth?', options: ['1', '2', '3', '4'], answer: '1', explanation: 'Each successful free throw is worth 1 point.' },
  { question: 'Which team did Kevin Durant join in 2016?', options: ['Brooklyn Nets', 'Golden State Warriors', 'Oklahoma City Thunder', 'Phoenix Suns'], answer: 'Golden State Warriors', explanation: 'Kevin Durant joined the Golden State Warriors in 2016, forming a superteam.' },
  { question: 'Who coached the Chicago Bulls during their 1990s dynasty?', options: ['Pat Riley', 'Phil Jackson', 'Larry Bird', 'Chuck Daly'], answer: 'Phil Jackson', explanation: 'Phil Jackson coached the Chicago Bulls to 6 championships in the 1990s.' },
  { question: 'Which player was selected 1st overall in the 2003 NBA Draft?', options: ['Carmelo Anthony', 'Dwyane Wade', 'LeBron James', 'Chris Bosh'], answer: 'LeBron James', explanation: 'LeBron James was selected 1st overall by the Cleveland Cavaliers in the 2003 NBA Draft.' },
  { question: 'What is the length of an NBA basketball court?', options: ['84 feet', '90 feet', '94 feet', '100 feet'], answer: '94 feet', explanation: 'An NBA basketball court is 94 feet (28.65 meters) long.' },
  { question: 'Which player is known as "The Slim Reaper"?', options: ['Kevin Durant', 'Kawhi Leonard', 'Paul George', 'Jimmy Butler'], answer: 'Kevin Durant', explanation: 'Kevin Durant earned the nickname "The Slim Reaper" due to his tall, slender build and lethal scoring ability.' },
  { question: 'Who holds the record for most three-pointers made in NBA history?', options: ['Ray Allen', 'Stephen Curry', 'Reggie Miller', 'Klay Thompson'], answer: 'Stephen Curry', explanation: 'Stephen Curry broke Ray Allen\'s record and holds the all-time record for most three-pointers made.' },
  { question: 'Which team won the NBA championship in 2016?', options: ['Golden State Warriors', 'Cleveland Cavaliers', 'Oklahoma City Thunder', 'Toronto Raptors'], answer: 'Cleveland Cavaliers', explanation: 'The Cleveland Cavaliers came back from 3-1 down to beat the Golden State Warriors in 2016.' },
  { question: 'What is the name of the trophy awarded to the NBA champion?', options: ['The Golden Trophy', 'Larry O\'Brien Championship Trophy', 'The NBA Cup', 'Bill Russell Trophy'], answer: 'Larry O\'Brien Championship Trophy', explanation: 'The Larry O\'Brien Championship Trophy is awarded to the NBA champion each year.' },
  { question: 'Which player won the NBA Finals MVP in 2023?', options: ['Jamal Murray', 'Nikola Jokić', 'Aaron Gordon', 'Michael Porter Jr'], answer: 'Nikola Jokić', explanation: 'Nikola Jokić won the Finals MVP as the Denver Nuggets claimed their first title.' },
  { question: 'How many quarters are in an NBA game?', options: ['2', '3', '4', '5'], answer: '4', explanation: 'An NBA game consists of 4 quarters, each lasting 12 minutes.' },
  { question: 'Which player is nicknamed "The Beard"?', options: ['LeBron James', 'James Harden', 'Russell Westbrook', 'Paul George'], answer: 'James Harden', explanation: 'James Harden is nicknamed "The Beard" due to his distinctive facial hair.' },
  { question: 'Which country won the 2019 FIBA Basketball World Cup?', options: ['USA', 'Spain', 'Australia', 'France'], answer: 'Spain', explanation: 'Spain defeated Argentina in the final to win the 2019 FIBA Basketball World Cup.' },
  { question: 'Who was named the NBA\'s Most Improved Player in 2023?', options: ['Ja Morant', 'Lauri Markkanen', 'Tyrese Haliburton', 'Shai Gilgeous-Alexander'], answer: 'Lauri Markkanen', explanation: 'Lauri Markkanen of the Utah Jazz won the Most Improved Player award in the 2022-23 season.' },
  { question: 'Which team did Kobe Bryant play his entire career with?', options: ['Chicago Bulls', 'Miami Heat', 'Los Angeles Lakers', 'Orlando Magic'], answer: 'Los Angeles Lakers', explanation: 'Kobe Bryant spent all 20 seasons of his NBA career with the Los Angeles Lakers.' },
  { question: 'What is a "double-double" in basketball?', options: ['Scoring twice in overtime', 'Two consecutive wins', 'Reaching double digits in two statistical categories', 'Two three-pointers in a row'], answer: 'Reaching double digits in two statistical categories', explanation: 'A double-double is when a player reaches 10 or more in two statistical categories like points and rebounds.' },
]

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function generateWithClaude(sport, rounds) {
  const sportName = sport === 'basketball' ? 'basketball (NBA, FIBA, players, history, rules)' : 'football/soccer (FIFA, Premier League, Champions League, players, history, rules, transfers)'
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Generate ${rounds} unique multiple choice trivia questions about ${sportName}. 
Return ONLY a JSON array, no markdown, no explanation. Each object must have:
- question (string)
- options (array of exactly 4 strings)
- answer (string, must exactly match one of the options)
- explanation (string, one sentence)

Make the questions varied — mix easy, medium and hard. Do not repeat common questions. Be creative and specific.`
      }]
    })
  })

  if (!response.ok) throw new Error('API failed')
  const data = await response.json()
  const text = data.content[0].text.trim()
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function generateQuestions({ rounds, sport }) {
  try {
    const questions = await generateWithClaude(sport, rounds || 5)
    if (Array.isArray(questions) && questions.length > 0) return questions
    throw new Error('Invalid response')
  } catch (e) {
    console.warn('Claude API failed, falling back to local questions:', e.message)
    const bank = sport === 'basketball' ? BASKETBALL_QUESTIONS : FOOTBALL_QUESTIONS
    return shuffle(bank).slice(0, rounds || 5).map(q => ({ ...q }))
  }
}