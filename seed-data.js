const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mzchurch';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const boardSchema = new mongoose.Schema({}, { strict: false, collection: 'boards' });
    const Board = mongoose.models.Board || mongoose.model('Board', boardSchema);

    await Board.deleteMany({});
    console.log('Cleared existing posts');

    const posts = [
      { title: '2025년 시온산교회 여름 수련회 안내', content: '사랑하는 성도 여러분, 2025년 여름 수련회를 안내합니다.\n\n일시: 2025년 7월 25일 ~ 27일\n장소: 강원도 속초 수련원\n주제: "주님과 함께하는 새로운 여정"\n\n참가비: 성인 15만원 / 학생 10만원\n신청 마감: 7월 15일까지', author: '관리자', category: '교회행사', boardType: 'notice', tags: ['수련회','여름'], isPinned: true, views: 245, createdAt: new Date('2025-06-01') },
      { title: '주일예배 시간 변경 안내 (6월부터)', content: '6월부터 주일예배 시간이 변경됩니다.\n\n1부 예배: 오전 9:00\n2부 예배: 오전 11:00\n수요예배: 오후 7:30\n금요기도회: 오후 9:00', author: '관리자', category: '예배안내', boardType: 'notice', tags: ['예배시간'], isPinned: true, views: 412, createdAt: new Date('2025-05-20') },
      { title: '새가족 환영회 안내', content: '매월 첫째 주일 오후 1시에 새가족 환영회가 진행됩니다.\n장소: 교육관 2층 친교실', author: '관리자', category: '안내', boardType: 'notice', tags: ['새가족'], views: 89, createdAt: new Date('2025-05-15') },
      { title: '한국 전통 효(孝) 사상과 성경의 부모 공경', content: '한국의 전통적인 효 사상은 유교적 가르침에 깊이 뿌리박고 있습니다. 공자의 가르침과 성경의 "네 부모를 공경하라"(출 20:12)는 놀라운 유사점을 보여줍니다.\n\n이 연구에서는 한국 전통 효 사상의 역사적 발전과 성경적 부모 공경의 원리를 비교 분석합니다.', author: '김성경 교수', category: '비교연구', boardType: 'korean_bible', tags: ['효도','유교','비교연구'], views: 156, createdAt: new Date('2025-05-28') },
      { title: '단군신화와 창세기의 창조 이야기 비교', content: '단군신화의 천부인(天符印) 사상과 창세기의 하나님의 형상(Imago Dei) 개념을 비교합니다.\n\n단군신화에서 환웅이 세 개의 천부인을 가지고 인간 세상에 내려온 것은 하늘의 권위와 질서가 땅에 임하는 것을 상징합니다.', author: '박신학 교수', category: '비교연구', boardType: 'korean_bible', tags: ['단군신화','창세기'], views: 203, createdAt: new Date('2025-05-10') },
      { title: '플라톤의 이데아론과 히브리서의 천상 성소', content: '플라톤은 감각적 세계 너머에 영원불변한 이데아의 세계가 존재한다고 가르쳤습니다. 히브리서 기자는 지상의 성막이 "하늘에 있는 것의 모형과 그림자"(히 8:5)라고 설명합니다.', author: '이철학 교수', category: '서양철학', boardType: 'world_bible', tags: ['플라톤','히브리서'], views: 178, createdAt: new Date('2025-05-25') },
      { title: '불교의 자비와 기독교의 아가페 사랑', content: '불교의 자비(慈悲, Karuṇā)와 기독교의 아가페(Agape) 사랑은 동서양 종교의 핵심 윤리적 가르침입니다.\n\n두 개념 모두 이타적 사랑을 가르치지만, 그 근거와 실천의 방향에서 중요한 차이가 있습니다.', author: '최종교 교수', category: '동양사상', boardType: 'world_bible', tags: ['불교','아가페'], views: 134, createdAt: new Date('2025-04-30') },
      { title: '「한국 기독교와 전통문화의 대화」 신간 안내', content: '우리 연구소에서 출판한 신간을 소개합니다.\n\n제목: 한국 기독교와 전통문화의 대화\n저자: 김성경, 박신학, 이철학\n출판사: 시온산출판사\n페이지: 432쪽', author: '관리자', category: '신간소개', boardType: 'books_papers', tags: ['신간','출판'], views: 92, createdAt: new Date('2025-06-05') },
      { title: '논문: 동아시아 종교다원주의 시대의 기독교 선교', content: '한국신학저널 제42권에 실린 논문을 소개합니다.\n\n저자: 박신학\n초록: 본 논문은 동아시아의 종교다원주의적 상황에서 기독교 선교의 새로운 패러다임을 모색합니다.', author: '박신학 교수', category: '논문', boardType: 'books_papers', tags: ['논문','선교학'], views: 67, createdAt: new Date('2025-05-18') },
      { title: '청년부 MT 후기 - 은혜의 시간이었습니다!', content: '지난 주말 청년부 MT에 다녀왔습니다. 정말 은혜로운 시간이었습니다.\n\n새벽 기도회에서 "너의 젊음을 하나님께 드려라"는 메시지가 가슴에 깊이 와닿았습니다.', author: '김청년', category: '후기', boardType: 'openforum', tags: ['청년부','MT'], views: 198, createdAt: new Date('2025-06-02') },
      { title: '기도 요청합니다 - 선교사님 건강을 위해', content: '중앙아시아에서 사역하고 계신 이선교 선교사님이 건강에 어려움을 겪고 계십니다.\n\n"너희 중에 고난 당하는 자가 있느냐 그는 기도할 것이요" (약 5:13)', author: '박집사', category: '기도요청', boardType: 'openforum', tags: ['기도요청','선교사'], views: 156, createdAt: new Date('2025-05-22') },
      { title: '주일학교 교사 모집합니다', content: '시온산교회 주일학교에서 교사를 모집합니다.\n\n대상: 유아부, 유치부, 아동부\n\n"마땅히 행할 길을 아이에게 가르치라" (잠 22:6)', author: '이집사', category: '모집', boardType: 'board', tags: ['주일학교','교사모집'], views: 145, createdAt: new Date('2025-06-03') },
      { title: '교회 주차장 이용 안내', content: '교회 주차장 이용에 대해 안내드립니다.\n\n1. 주일예배 시 교회 후면 주차장을 이용해 주세요.\n2. 장애인 및 노약자 우선 주차구역을 존중해 주세요.', author: '관리자', category: '안내', boardType: 'board', tags: ['주차장','안내'], views: 234, createdAt: new Date('2025-05-25') },
      { title: '산상수훈 시리즈 (1) - 심령이 가난한 자의 복', content: '마태복음 5:3 "심령이 가난한 자는 복이 있나니 천국이 그들의 것임이라"\n\n예수님의 산상수훈은 하나님 나라의 시민헌장이라 할 수 있습니다.', author: '담임목사', category: '주일설교', boardType: 'sermon', tags: ['산상수훈','팔복'], videoUrl: 'https://www.youtube.com/watch?v=example1', isPinned: true, views: 567, createdAt: new Date('2025-06-08') },
      { title: '산상수훈 시리즈 (2) - 애통하는 자의 위로', content: '마태복음 5:4 "애통하는 자는 복이 있나니 그들이 위로를 받을 것임이라"\n\n두 번째 복은 애통하는 자에게 주어집니다.', author: '담임목사', category: '주일설교', boardType: 'sermon', tags: ['산상수훈','위로'], videoUrl: 'https://www.youtube.com/watch?v=example2', views: 432, createdAt: new Date('2025-06-15') }
    ];

    const result = await Board.insertMany(posts);
    console.log(`Inserted ${result.length} sample posts`);

    const types = ['notice','korean_bible','world_bible','books_papers','openforum','board','sermon'];
    for (const t of types) {
      const c = await Board.countDocuments({ boardType: t });
      console.log(`  ${t}: ${c}`);
    }

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();