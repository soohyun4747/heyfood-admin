import { Timestamp } from 'firebase/firestore';
import { addUser, regions } from './homepageUtils.ts/firebase';
import { fakerKO as faker } from "@faker-js/faker";

export const addUsers100 = async () => {
  const users = Array.from({ length: 100 }, () => ({
    name: faker.person.fullName(), // 한국어 이름
    email: faker.internet.email(), // 이메일 (영어지만 한국 이름 기반 가능)
    phone: `010-${faker.number.int({ min: 1000, max: 9999 })}-${faker.number.int({ min: 1000, max: 9999 })}`, // 한국 전화번호
    address: `부산광역시 ${faker.location.city()} ${faker.location.street()}`, // 랜덤 한국 주소
    addressDetail: `${faker.number.int({ min: 1, max: 30 })}동 ${faker.number.int({ min: 101, max: 2000 })}호`, // 랜덤 동/호수
    createdAt: Timestamp.now(), // Firestore Timestamp
  }));

  // await Promise.all(users.map(user => addUser(user)));

  console.log("✅ 100명의 사용자 추가 완료!");
};
