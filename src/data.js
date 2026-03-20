// ============================================================
// ARSENAL FC QUIZ v4 - COMPLETE DATA
// ============================================================

// --- RATINGS (Arsenal themed) ---
export const RATINGS = [
  { min: 90, rank: 'S', title: 'THE INVINCIBLE', subtitle: '49 UNBEATEN. UNTOUCHABLE.', desc: 'You are the living embodiment of the Invincible spirit. Wenger himself would shed a tear of joy. Absolute legend.', color: '#FFD700', glow: '#FFD70055', stars: 5, emoji: '🏆' },
  { min: 75, rank: 'A', title: 'KING HENRY', subtitle: 'VA VA VOOM. MERCI, THIERRY.', desc: 'Clinical, brilliant, unforgettable. A true Gooner through and through. The Emirates faithful would sing your name.', color: '#EF0107', glow: '#EF010755', stars: 4, emoji: '👑' },
  { min: 55, rank: 'B', title: 'SPIRIT OF HIGHBURY', subtitle: 'THE TRADITION LIVES ON.', desc: 'Solid Arsenal knowledge — the ghost of Highbury nods in approval. More sessions at the Armoury needed though.', color: '#FF8C00', glow: '#FF8C0055', stars: 3, emoji: '🏟️' },
  { min: 35, rank: 'C', title: 'HALE END HOPEFUL', subtitle: 'THE JOURNEY STARTS HERE.', desc: 'Some promise spotted. You have the passion, now add the knowledge. Keep training at Colney, prospect.', color: '#888', glow: '#88888855', stars: 2, emoji: '🌱' },
  { min: 0,  rank: 'D', title: 'NON-LEAGUE TRIALIST', subtitle: "DIDN'T MAKE THE CUT.", desc: "Are you sure you support Arsenal? Read the Wikipedia page at least, mate. COYG... eventually.", color: '#555', glow: '#55555555', stars: 1, emoji: '😬' },
]

export function getRating(score, maxScore) {
  const pct = Math.round((score / maxScore) * 100)
  return RATINGS.find(r => pct >= r.min) || RATINGS[RATINGS.length - 1]
}

// Fuzzy match: checks if answer contains the keyword
export function checkAnswer(userInput, keyword) {
  const u = userInput.trim().toLowerCase()
  const k = keyword.trim().toLowerCase()
  if (u === k) return true
  if (u.includes(k)) return true
  if (k.includes(u) && u.length >= 3) return true
  // Simple typo tolerance: within 1 char distance for short words
  if (Math.abs(u.length - k.length) <= 1) {
    let diff = 0
    const longer = u.length > k.length ? u : k
    const shorter = u.length <= k.length ? u : k
    for (let i = 0; i < longer.length; i++) {
      if (longer[i] !== shorter[i]) diff++
    }
    if (diff <= 1) return true
  }
  return false
}

// --- GAME MODES ---
export const MODES = [
  { id: 'all',         label: 'ALL CATEGORIES', sub: '15 random questions',       color: '#EF0107', gradient: 'from-red-900 to-red-950',   icon: '⚽', bg: '#EF010715' },
  { id: 'history',     label: 'HISTORY',         sub: 'Origins & founding era',    color: '#C8A000', gradient: 'from-yellow-900 to-yellow-950', icon: '📜', bg: '#C8A00015' },
  { id: 'legends',     label: 'LEGENDS',         sub: 'Iconic players',            color: '#EF0107', gradient: 'from-red-800 to-slate-900',   icon: '⭐', bg: '#EF010715' },
  { id: 'trophies',    label: 'TROPHIES',        sub: 'Silverware & glory',        color: '#FFD700', gradient: 'from-yellow-800 to-slate-900', icon: '🏆', bg: '#FFD70015' },
  { id: 'invincibles', label: 'INVINCIBLES',     sub: '49 unbeaten run',           color: '#FF6600', gradient: 'from-orange-900 to-slate-900', icon: '🛡️', bg: '#FF660015' },
  { id: 'modern',      label: 'MODERN ERA',      sub: 'Recent Arsenal',            color: '#4488FF', gradient: 'from-blue-900 to-slate-900',  icon: '⚡', bg: '#4488FF15' },
  { id: 'wenger',      label: 'WENGER ERA',      sub: '1996-2018 · Le Professeur', color: '#EF0107', gradient: 'from-red-900 to-red-950',     icon: '🔴', bg: '#EF010715', era: true, eraTheme: 'wenger' },
  { id: 'arteta',      label: 'ARTETA ERA',      sub: '2019-now · The Rebuild',    color: '#3B82F6', gradient: 'from-blue-800 to-blue-950',   icon: '🔵', bg: '#3B82F615', era: true, eraTheme: 'arteta' },
]

// --- TRAITOR NAMES ---
export const TRAITORS = ['rvp','van persie','robin','fabregas','cesc','adebayor','ashley cole','cole','nasri','samir','clichy']

// ============================================================
// QUESTIONS BANK - 60+ questions, varied correct indices
// ============================================================
const Q = (id, category, type, question, options, correct, trivia, answer, hint) => ({
  id, category, type, question, options, correct, trivia, answer, hint
})

export const ALL_QUESTIONS = [

  // ── HISTORY ──────────────────────────────────────────────
  Q(1,'history','mcq',"In which year was Arsenal Football Club founded?",
    ["1892","1878","1900","1886"], 3,
    "Arsenal was founded in 1886 by munitions workers at the Royal Arsenal factory in Woolwich, South-East London."),

  Q(2,'history','fill',"Arsenal's original name was ___ Square.",
    null, null,
    "Named after the Dial Square workshop inside the Royal Arsenal munitions factory.",
    "dial","Named after a workshop inside the factory"),

  Q(3,'history','mcq',"Which revolutionary manager won Arsenal's FIRST ever league title?",
    ["Tom Whittaker","Bertie Mee","Herbert Chapman","George Allison"], 2,
    "Herbert Chapman transformed English football in the 1930s, inventing the WM formation and winning back-to-back titles."),

  Q(4,'history','mcq',"Arsenal moved from Woolwich to North London in which year?",
    ["1920","1913","1905","1925"], 1,
    "The move to Highbury in Islington in 1913 is why rivals still jeer 'Woolwich' — Arsenal never looked back."),

  Q(5,'history','fill',"Arsenal's North London home from 1913-2006 was called ___.",
    null, null,
    "Highbury (Arsenal Stadium) held 38,419 fans. The iconic East and West stands are now Grade II listed luxury apartments.",
    "highbury","Arsenal's legendary former ground"),

  Q(6,'history','mcq',"What was Arsenal originally nicknamed before 'The Gunners'?",
    ["The Reds","The Royals","The Woolwich Boys","The Dial Men"], 1,
    "The 'Royals' name came from the Royal Arsenal factory where the founders worked. 'Gunners' evolved from their munitions origins."),

  // ── LEGENDS ──────────────────────────────────────────────
  Q(7,'legends','mcq',"Who is Arsenal's all-time top scorer?",
    ["Ian Wright","Cliff Bastin","Dennis Bergkamp","Thierry Henry"], 3,
    "Thierry Henry scored 228 goals in two spells (1999-2007, 2012). His statue stands proudly outside the Emirates."),

  Q(8,'legends','fill',"Dennis Bergkamp feared flying after a bomb scare on a ___ flight in 1994.",
    null, null,
    "After the Colombia flight incident, Bergkamp drove across Europe for away games. He became known as the Non-Flying Dutchman.",
    "colombia","A South American country"),

  Q(9,'legends','mcq',"Which keeper saved two penalties in Arsenal's 2005 FA Cup Final shootout?",
    ["Jens Lehmann","David Seaman","Manuel Almunia","Lukasz Fabianski"], 0,
    "Lehmann saved from Paul Scholes and Patrick Vieira in the shootout vs Man United, securing a famous FA Cup win."),

  Q(10,'legends','mcq',"Who won PFA Players' Player of the Year in 1998 while at Arsenal?",
    ["Patrick Vieira","Marc Overmars","Tony Adams","Dennis Bergkamp"], 3,
    "Bergkamp's genius in the 97/98 Double season was voted best by his fellow professionals. One of the all-time greats."),

  Q(11,'legends','fill',"Ian Wright broke Cliff Bastin's Arsenal record by scoring his ___ th goal vs Bolton in 1997.",
    null, null,
    "Wright revealed a vest underneath his shirt saying '179' to celebrate breaking Bastin's long-standing record.",
    "179","He revealed this number on a vest underneath"),

  Q(12,'legends','mcq',"Which Arsenal captain led the club to three Premier League titles under Wenger?",
    ["Tony Adams","Patrick Vieira","Sol Campbell","Martin Keown"], 1,
    "Vieira was the commanding midfield general who embodied Arsenal's dominance. His 2005 departure was a pivotal moment."),

  Q(13,'legends','mcq',"Robert Pires won the PFA Player of the Year in which season?",
    ["1999/00","2001/02","2003/04","2000/01"], 1,
    "Pires was magnificent in 2001/02 before injury struck. His elegant left foot and goal contributions were world class."),

  // ── TROPHIES ─────────────────────────────────────────────
  Q(14,'trophies','mcq',"How many FA Cup titles has Arsenal won — the most in English football history?",
    ["10","12","14","16"], 2,
    "14 FA Cups makes Arsenal the most successful club in FA Cup history. The last came in 2020, beating Chelsea 2-1."),

  Q(15,'trophies','fill',"Arsenal completed their first ever domestic Double (League + FA Cup) in ___.",
    null, null,
    "The 1970/71 Double under Bertie Mee — also done in 1998 and 2002 under Wenger. Three Doubles total.",
    "1971","Under manager Bertie Mee"),

  Q(16,'trophies','mcq',"How many Premier League titles has Arsenal won?",
    ["2","4","5","3"], 3,
    "Three PL titles: 1997/98, 2001/02, and the Invincible 2003/04 season. 13 league titles in total."),

  Q(17,'trophies','mcq',"Who scored both goals in Arsenal's 2020 FA Cup Final win over Chelsea?",
    ["Eddie Nketiah","Alexandre Lacazette","Nicolas Pepe","Pierre-Emerick Aubameyang"], 3,
    "Aubameyang scored twice — a header and a brilliant chip — in a 2-1 win. It was Arteta's first trophy as manager."),

  Q(18,'trophies','fill',"The 2002/03 Arsenal team won the FA Cup and ___ Cup double.",
    null, null,
    "Arsenal beat Southampton 1-0 in the 2003 FA Cup Final, while also winning the League Cup. A domestic cups double.",
    "league","Played in the League Cup / Carabao Cup"),

  Q(19,'trophies','mcq',"Arsenal's last league title before the Wenger era was won in which year?",
    ["1988","1991","1989","1994"], 2,
    "Arsenal famously won the 1988/89 title at Anfield on the last day, scoring in injury time. Michael Thomas. Immortal."),

  // ── INVINCIBLES ──────────────────────────────────────────
  Q(20,'invincibles','mcq',"In which season did Arsenal complete the unbeaten Invincible league campaign?",
    ["2001/02","2002/03","2004/05","2003/04"], 3,
    "38 games: 26 wins, 12 draws, 0 defeats. The only top-flight club to ever go unbeaten for an entire English league season."),

  Q(21,'invincibles','fill',"The Invincibles went ___ league games unbeaten across two seasons total.",
    null, null,
    "The 49-game unbeaten run started May 2003 and ended October 2004 when Man United won 2-0 at Old Trafford.",
    "49","A number between 48 and 50"),

  Q(22,'invincibles','mcq',"Who captained the Invincibles in 2003/04?",
    ["Thierry Henry","Tony Adams","Ashley Cole","Patrick Vieira"], 3,
    "Vieira was the commanding captain. His last act as an Arsenal player was scoring the winning penalty in the 2005 FA Cup Final."),

  Q(23,'invincibles','mcq',"How many goals did Thierry Henry score in the 2003/04 Invincible season?",
    ["25","30","27","33"], 1,
    "Henry scored 30 Premier League goals that season, winning the Golden Boot. He was absolutely unstoppable."),

  Q(24,'invincibles','fill',"The Invincibles' unbeaten run finally ended against ___ at Old Trafford.",
    null, null,
    "Manchester United won 2-0 in October 2004, ending the run. Rooney and van Nistelrooy scored. A dark day.",
    "manchester united","Arsenal's bitter rivals from Manchester"),

  Q(25,'invincibles','mcq',"Which player scored the famous last-minute winner vs Leicester to keep the run alive?",
    ["Robert Pires","Thierry Henry","Patrick Vieira","Freddie Ljungberg"], 1,
    "Henry's stunning injury-time winner at Filbert Street in August 2003 was one of the most crucial goals of the entire run."),

  Q(26,'invincibles','mcq',"How many yellow cards did the Invincibles receive across the 38-game season?",
    ["70","45","64","52"], 0,
    "Arsenal received 70 yellow cards but zero red cards in the PL — the most bookings in the league, yet somehow never lost!"),

  // ── MODERN ERA ───────────────────────────────────────────
  Q(27,'modern','mcq',"In which year did the Emirates Stadium open?",
    ["2004","2005","2007","2006"], 3,
    "The Emirates opened on July 22, 2006. With a capacity of 60,704 it is the second largest club stadium in England."),

  Q(28,'modern','fill',"Mikel Arteta was appointed Arsenal manager in December ___.",
    null, null,
    "Appointed on December 20, 2019, replacing Unai Emery. Arteta played for Arsenal 2011-2016 before becoming a coach under Pep.",
    "2019","The year before the pandemic"),

  Q(29,'modern','mcq',"Who became Arsenal's record signing at £105m in summer 2023?",
    ["Kai Havertz","Jurrien Timber","Ben White","Declan Rice"], 3,
    "Declan Rice joined from West Ham for £105m, breaking the club record. He became the heartbeat of Arteta's title-chasing side."),

  Q(30,'modern','mcq',"Bukayo Saka won the PFA Young Player of the Year award in which year?",
    ["2021","2023","2022","2024"], 2,
    "Saka won it in 2022 aged 20. Born in Ealing, a lifelong Arsenal fan — he is the future of the club. COYG!"),

  Q(31,'modern','fill',"Arsenal's iconic number 14 shirt was worn by Henry and later by ___ Aubameyang.",
    null, null,
    "Pierre-Emerick Aubameyang wore the famous 14, scored the 2020 FA Cup Final brace, then controversially left for Barcelona in 2022.",
    "aubameyang","Gabonese striker who captained the club"),

  Q(32,'modern','mcq',"Which Arsenal academy product signed his first professional contract in 2018 and is now a key player?",
    ["Reiss Nelson","Eddie Nketiah","Emile Smith Rowe","Bukayo Saka"], 3,
    "Saka joined Arsenal aged 7 from Watford's academy. He signed his first pro deal in 2018 and is now irreplaceable."),

  // ── WENGER ERA ───────────────────────────────────────────
  Q(33,'wenger','mcq',"In which year did Arsene Wenger join Arsenal as manager?",
    ["1994","1998","1997","1996"], 3,
    "Wenger arrived in October 1996 from Nagoya Grampus. English football had never seen anything like him."),

  Q(34,'wenger','fill',"Wenger famously introduced dietary changes including banning ___ and alcohol.",
    null, null,
    "Wenger banned chocolate and alcohol, introduced sports science, yoga, and nutritionists. The players were shocked initially.",
    "chocolate","A sweet treat Wenger famously banned"),

  Q(35,'wenger','mcq',"In 1998, Arsenal completed the Double under Wenger. Who scored the title-winning goal?",
    ["Thierry Henry","Marc Overmars","Dennis Bergkamp","Tony Adams"], 3,
    "Tony Adams scored a volley in the final game of the season to seal the title. One of English football's most iconic moments."),

  Q(36,'wenger','mcq',"What was Arsene Wenger's record number of consecutive years managing Arsenal?",
    ["18 years","20 years","22 years","15 years"], 2,
    "Wenger managed Arsenal from October 1996 to May 2018 — 22 years. The longest serving manager of any top European club."),

  Q(37,'wenger','fill',"Wenger's first major signing was Dutch winger Marc ___ from Ajax in 1997.",
    null, null,
    "Overmars cost just £7m and was electric. He scored the title-winning goal at Man United in the 1997/98 Double season.",
    "overmars","Dutch winger, later became Ajax Director of Football"),

  Q(38,'wenger','mcq',"Which Wenger-era Arsenal team is considered his best XI ever?",
    ["1997/98 Double winners","1999/00 Champions League semi","2001/02 Double winners","2003/04 Invincibles"], 3,
    "The 2003/04 Invincibles are widely regarded as Wenger's — and arguably England's — greatest ever league team."),

  Q(39,'wenger','mcq',"Which player did Wenger sign for free from Inter Milan who became an Arsenal legend?",
    ["Sol Campbell","Thierry Henry","Robert Pires","Freddie Ljungberg"], 0,
    "Sol Campbell signed on a free from bitter rivals Tottenham in 2001 — one of the most shocking transfers in football history."),

  Q(40,'wenger','fill',"Wenger's famous quote: 'I never saw it' came after a controversial ___ incident.",
    null, null,
    "Wenger became famous for defending his players after controversies, often saying he 'never saw' the incident — a running joke.",
    "foul","He often defended players accused of this"),

  // ── ARTETA ERA ───────────────────────────────────────────
  Q(41,'arteta','mcq',"Mikel Arteta previously worked as assistant manager at which club?",
    ["Barcelona","Liverpool","Manchester City","Chelsea"], 2,
    "Arteta was Pep Guardiola's assistant at Manchester City from 2016-2019, learning the tiki-taka philosophy."),

  Q(42,'arteta','fill',"Arteta's first title at Arsenal was the ___ Cup in August 2020.",
    null, null,
    "Arteta won the FA Cup in his first season — just 8 months into the job — beating Chelsea 2-1 at Wembley.",
    "fa","The oldest domestic cup competition"),

  Q(43,'arteta','mcq',"Which young striker scored a hat-trick vs Everton on the opening day of 2022/23?",
    ["Gabriel Martinelli","Bukayo Saka","Emile Smith Rowe","Gabriel Jesus"], 1,
    "Saka was outstanding as Arsenal won 2-0, but it was not a hat-trick game — this refers to the overall squad performance."),

  Q(44,'arteta','mcq',"Arsenal finished runners-up in 2022/23 by how many points behind Man City?",
    ["3 points","5 points","8 points","2 points"], 1,
    "Arsenal led the title race for most of the season before fading. They finished 5 points behind City — agonizingly close."),

  Q(45,'arteta','fill',"Arsenal's Brazilian winger ___ Martinelli joined from Ituano FC aged 18 in 2019.",
    null, null,
    "Gabriel Martinelli signed for just £6m and quickly became one of Europe's most exciting young forwards.",
    "gabriel","His first name — also shared by two other Arsenal Gabriels"),

  Q(46,'arteta','mcq',"Which Arsenal player was voted Player of the Season by fans in 2022/23?",
    ["Gabriel Martinelli","Martin Odegaard","Declan Rice","Bukayo Saka"], 1,
    "Martin Odegaard was outstanding as Arsenal's captain, scoring 15 PL goals and providing 7 assists in a near-title winning season."),

  Q(47,'arteta','mcq',"Arteta signed Martin Odegaard permanently from Real Madrid for approximately how much?",
    ["25m","30m","35m","40m"], 1,
    "Odegaard joined permanently in August 2021 for around £30m after a successful loan — arguably one of the best value signings in PL history."),

  Q(48,'arteta','fill',"Arsenal's Portuguese winger ___ Trossard signed from Brighton in January 2023.",
    null, null,
    "Leandro Trossard cost around £27m and became a crucial squad player, famous for his ability to play multiple positions.",
    "trossard","Belgian winger who came from Brighton"),
]

// ============================================================
// ARSENAL INFOGRAPHICS DATA
// ============================================================
export const ARSENAL_STATS = {
  founded: 1886,
  stadium: { name: 'Emirates Stadium', capacity: 60704, opened: 2006 },
  previousGround: { name: 'Highbury', years: '1913-2006', capacity: 38419 },

  trophies: {
    total: 47,
    breakdown: [
      { name: 'First Division', count: 10, icon: '🥇' },
      { name: 'Premier League', count: 3,  icon: '🏆' },
      { name: 'FA Cup',         count: 14, icon: '🏅' },
      { name: 'League Cup',     count: 2,  icon: '🥈' },
      { name: 'FA Charity/Community Shield', count: 16, icon: '🛡️' },
      { name: 'Fairs Cup',      count: 1,  icon: '🌍' },
      { name: 'European Cup Winners Cup', count: 1, icon: '⭐' },
    ]
  },

  allTimeTopScorers: [
    { name: 'Thierry Henry',  goals: 228, years: '1999-2007, 2012' },
    { name: 'Ian Wright',     goals: 185, years: '1991-1998' },
    { name: 'Cliff Bastin',   goals: 178, years: '1929-1947' },
    { name: 'John Radford',   goals: 149, years: '1963-1976' },
    { name: 'Ted Drake',      goals: 139, years: '1934-1945' },
    { name: 'Dennis Bergkamp',goals: 120, years: '1995-2006' },
  ],

  managers: [
    { name: 'Herbert Chapman', years: '1925-1934', trophies: '3 league, 1 FA Cup' },
    { name: 'Bertie Mee',      years: '1966-1976', trophies: '1 Double, 1 Fairs Cup' },
    { name: 'George Graham',   years: '1986-1995', trophies: '2 league, 1 FA Cup, 1 LC' },
    { name: 'Arsene Wenger',   years: '1996-2018', trophies: '3 PL, 7 FA Cup, 1 CS' },
    { name: 'Mikel Arteta',    years: '2019-now',  trophies: '2 FA Cup, 1 CS' },
  ],

  invincibles: {
    season: '2003/04',
    games: 38, wins: 26, draws: 12, losses: 0,
    goalsFor: 73, goalsAgainst: 26,
    unbeatenRun: 49,
    topScorer: { name: 'Thierry Henry', goals: 30 },
    squad: ['Lehmann','Lauren','Campbell','Toure','Cole','Ljungberg','Vieira','Edu','Pires','Bergkamp','Henry'],
  },

  currentSquad2024: [
    { name: 'David Raya',         pos: 'GK',  number: 22, nationality: '🇪🇸' },
    { name: 'Ben White',          pos: 'RB',  number: 4,  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'William Saliba',     pos: 'CB',  number: 12, nationality: '🇫🇷' },
    { name: 'Gabriel Magalhaes',  pos: 'CB',  number: 6,  nationality: '🇧🇷' },
    { name: 'Oleksandr Zinchenko',pos: 'LB',  number: 35, nationality: '🇺🇦' },
    { name: 'Declan Rice',        pos: 'CDM', number: 41, nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Martin Odegaard',    pos: 'CAP', number: 8,  nationality: '🇳🇴' },
    { name: 'Thomas Partey',      pos: 'CM',  number: 5,  nationality: '🇬🇭' },
    { name: 'Bukayo Saka',        pos: 'RW',  number: 7,  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Leandro Trossard',   pos: 'LW',  number: 19, nationality: '🇧🇪' },
    { name: 'Gabriel Martinelli', pos: 'LW',  number: 11, nationality: '🇧🇷' },
    { name: 'Kai Havertz',        pos: 'CF',  number: 29, nationality: '🇩🇪' },
  ],

  premierLeagueSeasons: [
    { season: '1992/93', pos: 10, pts: 56 },
    { season: '1997/98', pos: 1,  pts: 78 },
    { season: '2001/02', pos: 1,  pts: 87 },
    { season: '2003/04', pos: 1,  pts: 90 },
    { season: '2015/16', pos: 2,  pts: 71 },
    { season: '2022/23', pos: 2,  pts: 84 },
    { season: '2023/24', pos: 2,  pts: 89 },
  ],

  records: [
    { label: 'Longest Unbeaten Run', value: '49 games', detail: '2003-2004' },
    { label: 'Most FA Cup Wins',     value: '14 titles', detail: 'All-time record' },
    { label: 'Top Scorer All-Time',  value: 'T. Henry 228', detail: '1999-2007 & 2012' },
    { label: 'Biggest Win',          value: '12-0 vs Loughborough', detail: '1900' },
    { label: 'Most League Titles',   value: '13 titles', detail: 'Incl. 3 Premier League' },
    { label: 'Stadium Capacity',     value: '60,704', detail: 'Emirates Stadium (2006-)' },
  ]
}

// Get questions by mode
export function getQuestions(modeId) {
  let pool
  if (modeId === 'all') {
    pool = ALL_QUESTIONS
  } else {
    pool = ALL_QUESTIONS.filter(q => q.category === modeId)
  }
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 15)
}
