import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from 'src/app.module';
import { AuthDto } from 'src/auth/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from 'src/user/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3000);
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3000');
  });
  afterAll(() => {
    app.close();
  });

  const dto: AuthDto = {
    email: 'hayden@gmail.com',
    password: 'abcd1234',
  };

  describe('Auth', () => {
    describe('Signup', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400)
          .inspect();
      });

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400)
          .inspect();
      });

      it('should throw if no body', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400).inspect();
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .inspect();
      });
    });

    describe('Signin', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400)
          .inspect();
      });

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400)
          .inspect();
      });

      it('should throw if no body', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400).inspect();
      });
      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .inspect();
      });
    });

    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Hayden',
          email: 'hayden@theclub.com',
        };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('Should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([])
          .inspect();
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First bookmark',
        link: 'https://developers.google.com/',
      };
      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(1)
          .inspect();
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'NestJs Course for Beginners - Create a REST API',
        description:
          'Learn NestJs by building a CRUD REST API with end-to-end tests using modern web development techniques.',
        link: 'https://www.youtube.com/watch?v=GHTA143_b-s&t=7116s&ab_channel=freeCodeCamp.org',
      };
      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .inspect();
      });
    });

    describe('Delete bookmark by id', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(204);
      });

      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
