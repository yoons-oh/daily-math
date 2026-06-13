import { SupportedLanguage } from './language'

export type ConceptLessonStep = {
  desc: string
  calc: string
  hl: string
  showAns: boolean
  carry: [string, string]
  voice: string
}

type ConceptLessonMap = Record<string, ConceptLessonStep[]>

const ko: ConceptLessonMap = {
  'add-basic': [
    { desc: '먼저 일의 자리끼리 더해요!', calc: '4 + 1 = 5', hl: 'ones', showAns: false, carry: ['', ''], voice: '먼저 일의 자리끼리 더해요. 4 더하기 1은 5예요.' },
    { desc: '다음 십의 자리끼리 더해요!', calc: '2 + 3 = 5', hl: 'tens', showAns: false, carry: ['', ''], voice: '다음은 십의 자리끼리 더해요. 2 더하기 3은 5예요.' },
    { desc: '정답은 55예요!', calc: '24 + 31 = 55', hl: 'all', showAns: true, carry: ['', ''], voice: '그래서 24 더하기 31의 정답은 55예요.' },
  ],
  'add-carry': [
    { desc: '일의 자리: 8 + 7 = 15', calc: '8 + 7 = 15', hl: 'ones', showAns: false, carry: ['', ''], voice: '먼저 일의 자리부터 더해요. 8 더하기 7은 15예요.' },
    { desc: '5는 아래에, 1은 십의 자리로 올려요!', calc: '받아올림: 1 ↑', hl: 'carry', showAns: false, carry: ['¹', ''], voice: '15에서 일의 자리 5는 아래에 쓰고, 십의 자리 1은 위로 올려요.' },
    { desc: '십의 자리: 4 + 3 + 올림(1) = 8', calc: '4 + 3 + 1 = 8', hl: 'tens', showAns: false, carry: ['¹', ''], voice: '이제 십의 자리를 더해요. 4 더하기 3에 올린 1까지 더하면 8이에요.' },
    { desc: '정답은 85예요!', calc: '48 + 37 = 85', hl: 'all', showAns: true, carry: ['¹', ''], voice: '그래서 48 더하기 37의 정답은 85예요. 받아올림 덧셈 성공!' },
  ],
  'sub-basic': [
    { desc: '먼저 일의 자리끼리 빼요!', calc: '5 - 2 = 3', hl: 'ones', showAns: false, carry: ['', ''], voice: '먼저 일의 자리끼리 빼요. 5 빼기 2는 3이에요.' },
    { desc: '다음 십의 자리끼리 빼요!', calc: '7 - 3 = 4', hl: 'tens', showAns: false, carry: ['', ''], voice: '다음은 십의 자리끼리 빼요. 7 빼기 3은 4예요.' },
    { desc: '정답은 43이에요!', calc: '75 - 32 = 43', hl: 'all', showAns: true, carry: ['', ''], voice: '그래서 75 빼기 32의 정답은 43이에요.' },
  ],
  'sub-borrow': [
    { desc: '일의 자리: 2에서 4를 뺄 수 없어요!', calc: '2 < 4', hl: 'ones', showAns: false, carry: ['', ''], voice: '일의 자리를 볼게요. 2에서는 4를 뺄 수 없어요.' },
    { desc: '십의 자리에서 10을 빌려요! 6 → 5', calc: '십의 자리 6 → 5', hl: 'borrow', showAns: false, carry: ['⁵', ''], voice: '그래서 십의 자리에서 10을 빌려와요. 십의 자리 6은 5가 돼요.' },
    { desc: '일의 자리: 12 - 4 = 8', calc: '12 - 4 = 8', hl: 'ones', showAns: false, carry: ['⁵', ''], voice: '빌려온 10과 원래 있던 2를 합쳐 일의 자리는 12가 되었어요. 12 빼기 4는 8이에요.' },
    { desc: '십의 자리: 5 - 2 = 3', calc: '5 - 2 = 3', hl: 'tens', showAns: false, carry: ['⁵', ''], voice: '다음은 십의 자리예요. 5 빼기 2는 3이에요.' },
    { desc: '정답은 38이에요!', calc: '62 - 24 = 38', hl: 'all', showAns: true, carry: ['⁵', ''], voice: '그래서 62 빼기 24의 정답은 38이에요.' },
  ],
}

const en: ConceptLessonMap = {
  'add-basic': [
    { desc: 'First, add the ones digits!', calc: '4 + 1 = 5', hl: 'ones', showAns: false, carry: ['', ''], voice: 'First, add the ones digits. 4 plus 1 equals 5.' },
    { desc: 'Next, add the tens digits!', calc: '2 + 3 = 5', hl: 'tens', showAns: false, carry: ['', ''], voice: 'Next, add the tens digits. 2 plus 3 equals 5.' },
    { desc: 'The answer is 55!', calc: '24 + 31 = 55', hl: 'all', showAns: true, carry: ['', ''], voice: 'So 24 plus 31 equals 55.' },
  ],
  'add-carry': [
    { desc: 'Ones: 8 + 7 = 15', calc: '8 + 7 = 15', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Start with the ones digits. 8 plus 7 equals 15.' },
    { desc: 'Write 5 below, carry 1 to tens!', calc: 'Carry: 1 ↑', hl: 'carry', showAns: false, carry: ['¹', ''], voice: 'From 15, write the ones digit 5 below, and carry 1 up to the tens place.' },
    { desc: 'Tens: 4 + 3 + 1 = 8', calc: '4 + 3 + 1 = 8', hl: 'tens', showAns: false, carry: ['¹', ''], voice: 'Now add the tens. 4 plus 3 plus the carried 1 equals 8.' },
    { desc: 'The answer is 85!', calc: '48 + 37 = 85', hl: 'all', showAns: true, carry: ['¹', ''], voice: 'So 48 plus 37 equals 85. Great carrying!' },
  ],
  'sub-basic': [
    { desc: 'First, subtract the ones digits!', calc: '5 - 2 = 3', hl: 'ones', showAns: false, carry: ['', ''], voice: 'First, subtract the ones digits. 5 minus 2 equals 3.' },
    { desc: 'Next, subtract the tens digits!', calc: '7 - 3 = 4', hl: 'tens', showAns: false, carry: ['', ''], voice: 'Next, subtract the tens digits. 7 minus 3 equals 4.' },
    { desc: 'The answer is 43!', calc: '75 - 32 = 43', hl: 'all', showAns: true, carry: ['', ''], voice: 'So 75 minus 32 equals 43.' },
  ],
  'sub-borrow': [
    { desc: 'Ones: 2 cannot subtract 4!', calc: '2 < 4', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Look at the ones place. We cannot subtract 4 from 2.' },
    { desc: 'Borrow 10 from tens! 6 → 5', calc: 'Tens 6 → 5', hl: 'borrow', showAns: false, carry: ['⁵', ''], voice: 'So we borrow 10 from the tens place. The tens digit 6 becomes 5.' },
    { desc: 'Ones: 12 - 4 = 8', calc: '12 - 4 = 8', hl: 'ones', showAns: false, carry: ['⁵', ''], voice: 'The borrowed 10 joins the 2, so the ones become 12. 12 minus 4 equals 8.' },
    { desc: 'Tens: 5 - 2 = 3', calc: '5 - 2 = 3', hl: 'tens', showAns: false, carry: ['⁵', ''], voice: 'Now subtract the tens. 5 minus 2 equals 3.' },
    { desc: 'The answer is 38!', calc: '62 - 24 = 38', hl: 'all', showAns: true, carry: ['⁵', ''], voice: 'So 62 minus 24 equals 38.' },
  ],
}

const zhCN: ConceptLessonMap = {
  'add-basic': [
    { desc: '先加个位！', calc: '4 + 1 = 5', hl: 'ones', showAns: false, carry: ['', ''], voice: '先加个位。4 加 1 等于 5。' },
    { desc: '再加十位！', calc: '2 + 3 = 5', hl: 'tens', showAns: false, carry: ['', ''], voice: '再加十位。2 加 3 等于 5。' },
    { desc: '答案是 55！', calc: '24 + 31 = 55', hl: 'all', showAns: true, carry: ['', ''], voice: '所以 24 加 31 等于 55。' },
  ],
  'add-carry': [
    { desc: '个位：8 + 7 = 15', calc: '8 + 7 = 15', hl: 'ones', showAns: false, carry: ['', ''], voice: '先看个位。8 加 7 等于 15。' },
    { desc: '5 写下面，1 进到十位！', calc: '进位：1 ↑', hl: 'carry', showAns: false, carry: ['¹', ''], voice: '15 里面，个位的 5 写在下面，1 进到十位上面。' },
    { desc: '十位：4 + 3 + 1 = 8', calc: '4 + 3 + 1 = 8', hl: 'tens', showAns: false, carry: ['¹', ''], voice: '现在加十位。4 加 3，再加进位的 1，等于 8。' },
    { desc: '答案是 85！', calc: '48 + 37 = 85', hl: 'all', showAns: true, carry: ['¹', ''], voice: '所以 48 加 37 等于 85。进位加法成功！' },
  ],
  'sub-basic': [
    { desc: '先减个位！', calc: '5 - 2 = 3', hl: 'ones', showAns: false, carry: ['', ''], voice: '先减个位。5 减 2 等于 3。' },
    { desc: '再减十位！', calc: '7 - 3 = 4', hl: 'tens', showAns: false, carry: ['', ''], voice: '再减十位。7 减 3 等于 4。' },
    { desc: '答案是 43！', calc: '75 - 32 = 43', hl: 'all', showAns: true, carry: ['', ''], voice: '所以 75 减 32 等于 43。' },
  ],
  'sub-borrow': [
    { desc: '个位：2 不能减 4！', calc: '2 < 4', hl: 'ones', showAns: false, carry: ['', ''], voice: '看个位。2 不能减 4。' },
    { desc: '从十位借 10！6 → 5', calc: '十位 6 → 5', hl: 'borrow', showAns: false, carry: ['⁵', ''], voice: '所以从十位借 10。十位的 6 变成 5。' },
    { desc: '个位：12 - 4 = 8', calc: '12 - 4 = 8', hl: 'ones', showAns: false, carry: ['⁵', ''], voice: '借来的 10 和原来的 2 合起来，个位变成 12。12 减 4 等于 8。' },
    { desc: '十位：5 - 2 = 3', calc: '5 - 2 = 3', hl: 'tens', showAns: false, carry: ['⁵', ''], voice: '现在减十位。5 减 2 等于 3。' },
    { desc: '答案是 38！', calc: '62 - 24 = 38', hl: 'all', showAns: true, carry: ['⁵', ''], voice: '所以 62 减 24 等于 38。' },
  ],
}

const vi: ConceptLessonMap = {
  'add-basic': [
    { desc: 'Trước tiên cộng hàng đơn vị!', calc: '4 + 1 = 5', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Trước tiên cộng hàng đơn vị. 4 cộng 1 bằng 5.' },
    { desc: 'Tiếp theo cộng hàng chục!', calc: '2 + 3 = 5', hl: 'tens', showAns: false, carry: ['', ''], voice: 'Tiếp theo cộng hàng chục. 2 cộng 3 bằng 5.' },
    { desc: 'Đáp án là 55!', calc: '24 + 31 = 55', hl: 'all', showAns: true, carry: ['', ''], voice: 'Vậy 24 cộng 31 bằng 55.' },
  ],
  'add-carry': [
    { desc: 'Hàng đơn vị: 8 + 7 = 15', calc: '8 + 7 = 15', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Bắt đầu từ hàng đơn vị. 8 cộng 7 bằng 15.' },
    { desc: 'Viết 5 ở dưới, nhớ 1 lên hàng chục!', calc: 'Nhớ: 1 ↑', hl: 'carry', showAns: false, carry: ['¹', ''], voice: 'Trong 15, viết 5 ở hàng đơn vị bên dưới, và nhớ 1 lên hàng chục.' },
    { desc: 'Hàng chục: 4 + 3 + 1 = 8', calc: '4 + 3 + 1 = 8', hl: 'tens', showAns: false, carry: ['¹', ''], voice: 'Bây giờ cộng hàng chục. 4 cộng 3, thêm 1 nhớ, bằng 8.' },
    { desc: 'Đáp án là 85!', calc: '48 + 37 = 85', hl: 'all', showAns: true, carry: ['¹', ''], voice: 'Vậy 48 cộng 37 bằng 85. Con đã cộng có nhớ rất tốt!' },
  ],
  'sub-basic': [
    { desc: 'Trước tiên trừ hàng đơn vị!', calc: '5 - 2 = 3', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Trước tiên trừ hàng đơn vị. 5 trừ 2 bằng 3.' },
    { desc: 'Tiếp theo trừ hàng chục!', calc: '7 - 3 = 4', hl: 'tens', showAns: false, carry: ['', ''], voice: 'Tiếp theo trừ hàng chục. 7 trừ 3 bằng 4.' },
    { desc: 'Đáp án là 43!', calc: '75 - 32 = 43', hl: 'all', showAns: true, carry: ['', ''], voice: 'Vậy 75 trừ 32 bằng 43.' },
  ],
  'sub-borrow': [
    { desc: 'Hàng đơn vị: 2 không trừ được 4!', calc: '2 < 4', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Nhìn vào hàng đơn vị. 2 không trừ được 4.' },
    { desc: 'Mượn 10 từ hàng chục! 6 → 5', calc: 'Hàng chục 6 → 5', hl: 'borrow', showAns: false, carry: ['⁵', ''], voice: 'Vì vậy ta mượn 10 từ hàng chục. Số 6 ở hàng chục trở thành 5.' },
    { desc: 'Hàng đơn vị: 12 - 4 = 8', calc: '12 - 4 = 8', hl: 'ones', showAns: false, carry: ['⁵', ''], voice: '10 mượn được cộng với 2, nên hàng đơn vị thành 12. 12 trừ 4 bằng 8.' },
    { desc: 'Hàng chục: 5 - 2 = 3', calc: '5 - 2 = 3', hl: 'tens', showAns: false, carry: ['⁵', ''], voice: 'Bây giờ trừ hàng chục. 5 trừ 2 bằng 3.' },
    { desc: 'Đáp án là 38!', calc: '62 - 24 = 38', hl: 'all', showAns: true, carry: ['⁵', ''], voice: 'Vậy 62 trừ 24 bằng 38.' },
  ],
}

const th: ConceptLessonMap = {
  'add-basic': [
    { desc: 'ก่อนอื่น บวกหลักหน่วย!', calc: '4 + 1 = 5', hl: 'ones', showAns: false, carry: ['', ''], voice: 'ก่อนอื่น บวกหลักหน่วย 4 บวก 1 เท่ากับ 5' },
    { desc: 'ต่อไป บวกหลักสิบ!', calc: '2 + 3 = 5', hl: 'tens', showAns: false, carry: ['', ''], voice: 'ต่อไป บวกหลักสิบ 2 บวก 3 เท่ากับ 5' },
    { desc: 'คำตอบคือ 55!', calc: '24 + 31 = 55', hl: 'all', showAns: true, carry: ['', ''], voice: 'ดังนั้น 24 บวก 31 เท่ากับ 55' },
  ],
  'add-carry': [
    { desc: 'หลักหน่วย: 8 + 7 = 15', calc: '8 + 7 = 15', hl: 'ones', showAns: false, carry: ['', ''], voice: 'เริ่มจากหลักหน่วย 8 บวก 7 เท่ากับ 15' },
    { desc: 'เขียน 5 ด้านล่าง ทด 1 ไปหลักสิบ!', calc: 'ทด: 1 ↑', hl: 'carry', showAns: false, carry: ['¹', ''], voice: 'จาก 15 ให้เขียน 5 ไว้ด้านล่าง และทด 1 ขึ้นไปที่หลักสิบ' },
    { desc: 'หลักสิบ: 4 + 3 + 1 = 8', calc: '4 + 3 + 1 = 8', hl: 'tens', showAns: false, carry: ['¹', ''], voice: 'ตอนนี้บวกหลักสิบ 4 บวก 3 และบวก 1 ที่ทดไว้ เท่ากับ 8' },
    { desc: 'คำตอบคือ 85!', calc: '48 + 37 = 85', hl: 'all', showAns: true, carry: ['¹', ''], voice: 'ดังนั้น 48 บวก 37 เท่ากับ 85 เก่งมาก' },
  ],
  'sub-basic': [
    { desc: 'ก่อนอื่น ลบหลักหน่วย!', calc: '5 - 2 = 3', hl: 'ones', showAns: false, carry: ['', ''], voice: 'ก่อนอื่น ลบหลักหน่วย 5 ลบ 2 เท่ากับ 3' },
    { desc: 'ต่อไป ลบหลักสิบ!', calc: '7 - 3 = 4', hl: 'tens', showAns: false, carry: ['', ''], voice: 'ต่อไป ลบหลักสิบ 7 ลบ 3 เท่ากับ 4' },
    { desc: 'คำตอบคือ 43!', calc: '75 - 32 = 43', hl: 'all', showAns: true, carry: ['', ''], voice: 'ดังนั้น 75 ลบ 32 เท่ากับ 43' },
  ],
  'sub-borrow': [
    { desc: 'หลักหน่วย: 2 ลบ 4 ไม่ได้!', calc: '2 < 4', hl: 'ones', showAns: false, carry: ['', ''], voice: 'ดูหลักหน่วย 2 ลบ 4 ไม่ได้' },
    { desc: 'ยืม 10 จากหลักสิบ! 6 → 5', calc: 'หลักสิบ 6 → 5', hl: 'borrow', showAns: false, carry: ['⁵', ''], voice: 'ดังนั้นเรายืม 10 จากหลักสิบ เลข 6 ในหลักสิบจึงกลายเป็น 5' },
    { desc: 'หลักหน่วย: 12 - 4 = 8', calc: '12 - 4 = 8', hl: 'ones', showAns: false, carry: ['⁵', ''], voice: '10 ที่ยืมมารวมกับ 2 ทำให้หลักหน่วยเป็น 12. 12 ลบ 4 เท่ากับ 8' },
    { desc: 'หลักสิบ: 5 - 2 = 3', calc: '5 - 2 = 3', hl: 'tens', showAns: false, carry: ['⁵', ''], voice: 'ตอนนี้ลบหลักสิบ 5 ลบ 2 เท่ากับ 3' },
    { desc: 'คำตอบคือ 38!', calc: '62 - 24 = 38', hl: 'all', showAns: true, carry: ['⁵', ''], voice: 'ดังนั้น 62 ลบ 24 เท่ากับ 38' },
  ],
}

const id: ConceptLessonMap = {
  'add-basic': [
    { desc: 'Pertama, jumlahkan satuan!', calc: '4 + 1 = 5', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Pertama, jumlahkan angka satuan. 4 tambah 1 sama dengan 5.' },
    { desc: 'Lalu, jumlahkan puluhan!', calc: '2 + 3 = 5', hl: 'tens', showAns: false, carry: ['', ''], voice: 'Lalu, jumlahkan angka puluhan. 2 tambah 3 sama dengan 5.' },
    { desc: 'Jawabannya 55!', calc: '24 + 31 = 55', hl: 'all', showAns: true, carry: ['', ''], voice: 'Jadi 24 tambah 31 sama dengan 55.' },
  ],
  'add-carry': [
    { desc: 'Satuan: 8 + 7 = 15', calc: '8 + 7 = 15', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Mulai dari satuan. 8 tambah 7 sama dengan 15.' },
    { desc: 'Tulis 5 di bawah, simpan 1 ke puluhan!', calc: 'Simpan: 1 ↑', hl: 'carry', showAns: false, carry: ['¹', ''], voice: 'Dari 15, tulis angka satuan 5 di bawah, lalu simpan 1 ke tempat puluhan.' },
    { desc: 'Puluhan: 4 + 3 + 1 = 8', calc: '4 + 3 + 1 = 8', hl: 'tens', showAns: false, carry: ['¹', ''], voice: 'Sekarang jumlahkan puluhan. 4 tambah 3 tambah 1 yang disimpan sama dengan 8.' },
    { desc: 'Jawabannya 85!', calc: '48 + 37 = 85', hl: 'all', showAns: true, carry: ['¹', ''], voice: 'Jadi 48 tambah 37 sama dengan 85. Berhasil!' },
  ],
  'sub-basic': [
    { desc: 'Pertama, kurangi satuan!', calc: '5 - 2 = 3', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Pertama, kurangi angka satuan. 5 kurang 2 sama dengan 3.' },
    { desc: 'Lalu, kurangi puluhan!', calc: '7 - 3 = 4', hl: 'tens', showAns: false, carry: ['', ''], voice: 'Lalu, kurangi angka puluhan. 7 kurang 3 sama dengan 4.' },
    { desc: 'Jawabannya 43!', calc: '75 - 32 = 43', hl: 'all', showAns: true, carry: ['', ''], voice: 'Jadi 75 kurang 32 sama dengan 43.' },
  ],
  'sub-borrow': [
    { desc: 'Satuan: 2 tidak bisa dikurangi 4!', calc: '2 < 4', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Lihat tempat satuan. 2 tidak bisa dikurangi 4.' },
    { desc: 'Pinjam 10 dari puluhan! 6 → 5', calc: 'Puluhan 6 → 5', hl: 'borrow', showAns: false, carry: ['⁵', ''], voice: 'Jadi kita pinjam 10 dari tempat puluhan. Angka puluhan 6 menjadi 5.' },
    { desc: 'Satuan: 12 - 4 = 8', calc: '12 - 4 = 8', hl: 'ones', showAns: false, carry: ['⁵', ''], voice: '10 yang dipinjam bergabung dengan 2, jadi satuannya menjadi 12. 12 kurang 4 sama dengan 8.' },
    { desc: 'Puluhan: 5 - 2 = 3', calc: '5 - 2 = 3', hl: 'tens', showAns: false, carry: ['⁵', ''], voice: 'Sekarang kurangi puluhan. 5 kurang 2 sama dengan 3.' },
    { desc: 'Jawabannya 38!', calc: '62 - 24 = 38', hl: 'all', showAns: true, carry: ['⁵', ''], voice: 'Jadi 62 kurang 24 sama dengan 38.' },
  ],
}

const es: ConceptLessonMap = {
  'add-basic': [
    { desc: 'Primero suma las unidades.', calc: '4 + 1 = 5', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Primero suma las unidades. 4 más 1 es igual a 5.' },
    { desc: 'Después suma las decenas.', calc: '2 + 3 = 5', hl: 'tens', showAns: false, carry: ['', ''], voice: 'Después suma las decenas. 2 más 3 es igual a 5.' },
    { desc: 'La respuesta es 55.', calc: '24 + 31 = 55', hl: 'all', showAns: true, carry: ['', ''], voice: 'Entonces 24 más 31 es igual a 55.' },
  ],
  'add-carry': [
    { desc: 'Unidades: 8 + 7 = 15', calc: '8 + 7 = 15', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Empieza con las unidades. 8 más 7 es igual a 15.' },
    { desc: 'Escribe 5 abajo y lleva 1 a decenas.', calc: 'Llevada: 1 ↑', hl: 'carry', showAns: false, carry: ['¹', ''], voice: 'Del 15, escribe el 5 abajo en las unidades y lleva 1 arriba a las decenas.' },
    { desc: 'Decenas: 4 + 3 + 1 = 8', calc: '4 + 3 + 1 = 8', hl: 'tens', showAns: false, carry: ['¹', ''], voice: 'Ahora suma las decenas. 4 más 3, más el 1 que llevamos, es igual a 8.' },
    { desc: 'La respuesta es 85.', calc: '48 + 37 = 85', hl: 'all', showAns: true, carry: ['¹', ''], voice: 'Entonces 48 más 37 es igual a 85. Muy bien.' },
  ],
  'sub-basic': [
    { desc: 'Primero resta las unidades.', calc: '5 - 2 = 3', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Primero resta las unidades. 5 menos 2 es igual a 3.' },
    { desc: 'Después resta las decenas.', calc: '7 - 3 = 4', hl: 'tens', showAns: false, carry: ['', ''], voice: 'Después resta las decenas. 7 menos 3 es igual a 4.' },
    { desc: 'La respuesta es 43.', calc: '75 - 32 = 43', hl: 'all', showAns: true, carry: ['', ''], voice: 'Entonces 75 menos 32 es igual a 43.' },
  ],
  'sub-borrow': [
    { desc: 'Unidades: 2 no puede restar 4.', calc: '2 < 4', hl: 'ones', showAns: false, carry: ['', ''], voice: 'Mira las unidades. No podemos restar 4 de 2.' },
    { desc: 'Pide prestado 10 a decenas. 6 → 5', calc: 'Decenas 6 → 5', hl: 'borrow', showAns: false, carry: ['⁵', ''], voice: 'Entonces pedimos prestado 10 a las decenas. El 6 de las decenas se convierte en 5.' },
    { desc: 'Unidades: 12 - 4 = 8', calc: '12 - 4 = 8', hl: 'ones', showAns: false, carry: ['⁵', ''], voice: 'El 10 prestado se junta con el 2, así que las unidades son 12. 12 menos 4 es igual a 8.' },
    { desc: 'Decenas: 5 - 2 = 3', calc: '5 - 2 = 3', hl: 'tens', showAns: false, carry: ['⁵', ''], voice: 'Ahora resta las decenas. 5 menos 2 es igual a 3.' },
    { desc: 'La respuesta es 38.', calc: '62 - 24 = 38', hl: 'all', showAns: true, carry: ['⁵', ''], voice: 'Entonces 62 menos 24 es igual a 38.' },
  ],
}

const ja: ConceptLessonMap = {
  'add-basic': [
    { desc: 'まず一の位をたします！', calc: '4 + 1 = 5', hl: 'ones', showAns: false, carry: ['', ''], voice: 'まず一の位をたします。4たす1は5です。' },
    { desc: '次に十の位をたします！', calc: '2 + 3 = 5', hl: 'tens', showAns: false, carry: ['', ''], voice: '次は十の位をたします。2たす3は5です。' },
    { desc: '答えは55です！', calc: '24 + 31 = 55', hl: 'all', showAns: true, carry: ['', ''], voice: 'なので24たす31の答えは55です。' },
  ],
  'add-carry': [
    { desc: '一の位：8 + 7 = 15', calc: '8 + 7 = 15', hl: 'ones', showAns: false, carry: ['', ''], voice: 'まず一の位からたします。8たす7は15です。' },
    { desc: '5は下に、1は十の位へくり上げます！', calc: 'くり上がり：1 ↑', hl: 'carry', showAns: false, carry: ['¹', ''], voice: '15の一の位5は下に書き、十の位の1は上にくり上げます。' },
    { desc: '十の位：4 + 3 + くり上がり(1) = 8', calc: '4 + 3 + 1 = 8', hl: 'tens', showAns: false, carry: ['¹', ''], voice: '次に十の位をたします。4たす3にくり上がりの1を加えると8です。' },
    { desc: '答えは85です！', calc: '48 + 37 = 85', hl: 'all', showAns: true, carry: ['¹', ''], voice: 'なので48たす37の答えは85です。くり上がりのたし算できた！' },
  ],
  'sub-basic': [
    { desc: 'まず一の位をひきます！', calc: '5 - 2 = 3', hl: 'ones', showAns: false, carry: ['', ''], voice: 'まず一の位をひきます。5ひく2は3です。' },
    { desc: '次に十の位をひきます！', calc: '7 - 3 = 4', hl: 'tens', showAns: false, carry: ['', ''], voice: '次は十の位をひきます。7ひく3は4です。' },
    { desc: '答えは43です！', calc: '75 - 32 = 43', hl: 'all', showAns: true, carry: ['', ''], voice: 'なので75ひく32の答えは43です。' },
  ],
  'sub-borrow': [
    { desc: '一の位：2から4はひけません。', calc: '2 < 4', hl: 'ones', showAns: false, carry: ['', ''], voice: '一の位を見てください。2から4はひけません。' },
    { desc: '十の位から10を借ります。6 → 5', calc: '十の位 6 → 5', hl: 'borrow', showAns: false, carry: ['⁵', ''], voice: 'だから十の位から10を借ります。十の位の6が5になります。' },
    { desc: '一の位：12 - 4 = 8', calc: '12 - 4 = 8', hl: 'ones', showAns: false, carry: ['⁵', ''], voice: '借りた10と2を合わせると12。12ひく4は8です。' },
    { desc: '十の位：5 - 2 = 3', calc: '5 - 2 = 3', hl: 'tens', showAns: false, carry: ['⁵', ''], voice: '次に十の位をひきます。5ひく2は3です。' },
    { desc: '答えは38です！', calc: '62 - 24 = 38', hl: 'all', showAns: true, carry: ['⁵', ''], voice: 'なので62ひく24の答えは38です。' },
  ],
}

const lessons: Record<SupportedLanguage, ConceptLessonMap> = {
  ko,
  en,
  'zh-CN': zhCN,
  vi,
  th,
  id,
  es,
  ja,
}

export function getConceptLessonSteps(conceptId: string, language: SupportedLanguage): ConceptLessonStep[] {
  return lessons[language]?.[conceptId] ?? lessons.ko[conceptId] ?? []
}
