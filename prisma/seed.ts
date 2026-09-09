// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Nettoyer les données existantes (dans l'ordre inverse des dépendances)
  await prisma.review.deleteMany({});
  await prisma.galleryImage.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.appointmentReason.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.office.deleteMany({});

  console.log('✅ Cleaned existing data');

  // Créer le cabinet
  const office = await prisma.office.create({
    data: {
      name: 'Cabinet Modèle',
      address: '123 Avenue Bensouna, Chlef 02000',
      city: 'Chlef',
      phone: '+213 27 72 45 68',
      email: 'contact@cabinet-modele.dz',
      openingHours: {
        sunday: { open: '08:00', close: '17:00' },
        monday: { open: '08:00', close: '17:00' },
        tuesday: { open: '08:00', close: '17:00' },
        wednesday: { open: '08:00', close: '17:00' },
        thursday: { open: '08:00', close: '17:00' },
        friday: { closed: true },
        saturday: { closed: true },
      },
    },
  });

  console.log('✅ Created office:', office.name);

  // Créer les motifs de consultation
  const reasons = await Promise.all([
    prisma.appointmentReason.create({
      data: {
        name: 'Consultation générale',
        duration: 20,
        color: '#3B82F6',
        officeId: office.id,
      },
    }),
    prisma.appointmentReason.create({
      data: {
        name: 'Détartrage',
        duration: 30,
        color: '#10B981',
        officeId: office.id,
      },
    }),
    prisma.appointmentReason.create({
      data: {
        name: 'Blanchiment dentaire',
        duration: 45,
        color: '#F59E0B',
        officeId: office.id,
      },
    }),
    prisma.appointmentReason.create({
      data: {
        name: 'Extraction',
        duration: 30,
        color: '#EF4444',
        officeId: office.id,
      },
    }),
    prisma.appointmentReason.create({
      data: {
        name: 'Plombage / Traitement de carie',
        duration: 45,
        color: '#8B5CF6',
        officeId: office.id,
      },
    }),
    prisma.appointmentReason.create({
      data: {
        name: 'Orthodontie',
        duration: 60,
        color: '#EC4899',
        officeId: office.id,
      },
    }),
    prisma.appointmentReason.create({
      data: {
        name: 'Urgence dentaire',
        duration: 30,
        color: '#DC2626',
        officeId: office.id,
      },
    }),
    prisma.appointmentReason.create({
      data: {
        name: 'Pose de couronne',
        duration: 60,
        color: '#6366F1',
        officeId: office.id,
      },
    }),
  ]);

  console.log('✅ Created', reasons.length, 'appointment reasons');

  // Créer les patients
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        firstName: 'Amina',
        lastName: 'Benali',
        phone: '+213 555 12 34 56',
        email: 'amina.benali@email.dz',
        dateOfBirth: new Date('1985-03-15'),
        officeId: office.id,
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Karim',
        lastName: 'Messaoudi',
        phone: '+213 661 23 45 67',
        email: 'karim.messaoudi@email.dz',
        dateOfBirth: new Date('1992-07-22'),
        officeId: office.id,
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Fatima',
        lastName: 'Boumediene',
        phone: '+213 770 34 56 78',
        email: 'fatima.boumediene@email.dz',
        dateOfBirth: new Date('1978-11-08'),
        officeId: office.id,
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Youcef',
        lastName: 'Mansouri',
        phone: '+213 555 45 67 89',
        email: 'youcef.mansouri@email.dz',
        dateOfBirth: new Date('2000-05-30'),
        officeId: office.id,
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Soraya',
        lastName: 'Hamidi',
        phone: '+213 661 56 78 90',
        email: 'soraya.hamidi@email.dz',
        dateOfBirth: new Date('1995-09-12'),
        officeId: office.id,
      },
    }),
  ]);

  console.log('✅ Created', patients.length, 'patients');

  // Fonction helper pour créer une date dans les 30 derniers jours
  function randomPastDate(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(8 + Math.floor(Math.random() * 8), [0, 30][Math.floor(Math.random() * 2)], 0, 0);
    return date;
  }

  // Fonction helper pour créer une date dans les 5 prochains jours
  function futureDateInNext5Days(dayOffset: number, hour: number, minute: number = 0): Date {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);
    // Skip vendredi (5) et samedi (6)
    while (date.getDay() === 5 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }

    return date;
  }

  // Créer des rendez-vous passés (terminés ou annulés)
  const pastAppointments = [];
  // Patient récurrent : Amina (3 rendez-vous passés)
  pastAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        officeId: office.id,
        reasonId: reasons[1].id, // Détartrage
        date: randomPastDate(30),
        status: 'completed',
        notes: 'Détartrage complet effectué',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        officeId: office.id,
        reasonId: reasons[4].id, // Plombage
        date: randomPastDate(20),
        status: 'completed',
        notes: 'Traitement carie molaire inférieure gauche',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation
        date: randomPastDate(10),
        status: 'completed',
      },
    })
  );

  // Patient récurrent : Karim (2 rendez-vous)
  pastAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        officeId: office.id,
        reasonId: reasons[5].id, // Orthodontie
        date: randomPastDate(25),
        status: 'completed',
        notes: 'Première consultation orthodontie',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        officeId: office.id,
        reasonId: reasons[5].id, // Orthodontie
        date: randomPastDate(15),
        status: 'completed',
        notes: 'Suivi orthodontie - ajustement appareil',
      },
    })
  );

  // Patient récurrent : Fatima (2 rendez-vous, dont un annulé)
  pastAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        officeId: office.id,
        reasonId: reasons[2].id, // Blanchiment
        date: randomPastDate(28),
        status: 'completed',
        notes: 'Blanchiment dentaire réalisé',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation
        date: randomPastDate(12),
        status: 'cancelled',
        notes: 'Patient a annulé - conflit d\'horaire',
      },
    })
  );

  // Nouveaux patients (1 rendez-vous chacun)
  pastAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        officeId: office.id,
        reasonId: reasons[6].id, // Urgence
        date: randomPastDate(8),
        status: 'completed',
        notes: 'Urgence - douleur dentaire aiguë traitée',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        officeId: office.id,
        reasonId: reasons[3].id, // Extraction
        date: randomPastDate(5),
        status: 'completed',
        notes: 'Extraction dent de sagesse',
      },
    })
  );

  // Quelques rendez-vous passés supplémentaires pour remplir l'historique
  pastAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        officeId: office.id,
        reasonId: reasons[1].id, // Détartrage
        date: randomPastDate(22),
        status: 'completed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        officeId: office.id,
        reasonId: reasons[7].id, // Couronne
        date: randomPastDate(18),
        status: 'completed',
        notes: 'Pose couronne céramique',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation
        date: randomPastDate(14),
        status: 'cancelled',
        notes: 'Annulé par le patient',
      },
    })
  );

  await Promise.all(pastAppointments);
  console.log('✅ Created', pastAppointments.length, 'past appointments');

  // Créer des rendez-vous à venir (concentrés sur les 5 prochains jours)
  const futureAppointments = [];

  // Jour 1 (demain) - 5 rendez-vous
  futureAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation - 20min
        date: futureDateInNext5Days(1, 8, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        officeId: office.id,
        reasonId: reasons[1].id, // Détartrage - 30min
        date: futureDateInNext5Days(1, 9, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        officeId: office.id,
        reasonId: reasons[4].id, // Plombage - 45min
        date: futureDateInNext5Days(1, 10, 30),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation - 20min
        date: futureDateInNext5Days(1, 13, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        officeId: office.id,
        reasonId: reasons[2].id, // Blanchiment - 45min
        date: futureDateInNext5Days(1, 14, 0),
        status: 'confirmed',
      },
    })
  );

  // Jour 2 - 6 rendez-vous (journée bien remplie)
  futureAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        officeId: office.id,
        reasonId: reasons[5].id, // Orthodontie - 60min
        date: futureDateInNext5Days(2, 8, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        officeId: office.id,
        reasonId: reasons[1].id, // Détartrage - 30min
        date: futureDateInNext5Days(2, 9, 30),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation - 20min
        date: futureDateInNext5Days(2, 11, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        officeId: office.id,
        reasonId: reasons[4].id, // Plombage - 45min
        date: futureDateInNext5Days(2, 13, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        officeId: office.id,
        reasonId: reasons[7].id, // Couronne - 60min
        date: futureDateInNext5Days(2, 14, 30),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation - 20min
        date: futureDateInNext5Days(2, 16, 0),
        status: 'confirmed',
      },
    })
  );

  // Jour 3 - 3 rendez-vous (journée plus légère)
  futureAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        officeId: office.id,
        reasonId: reasons[1].id, // Détartrage - 30min
        date: futureDateInNext5Days(3, 9, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation - 20min
        date: futureDateInNext5Days(3, 11, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        officeId: office.id,
        reasonId: reasons[2].id, // Blanchiment - 45min
        date: futureDateInNext5Days(3, 14, 0),
        status: 'confirmed',
      },
    })
  );

  // Jour 4 - 5 rendez-vous
  futureAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation - 20min
        date: futureDateInNext5Days(4, 8, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        officeId: office.id,
        reasonId: reasons[4].id, // Plombage - 45min
        date: futureDateInNext5Days(4, 9, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        officeId: office.id,
        reasonId: reasons[1].id, // Détartrage - 30min
        date: futureDateInNext5Days(4, 11, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        officeId: office.id,
        reasonId: reasons[3].id, // Extraction - 30min
        date: futureDateInNext5Days(4, 13, 30),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        officeId: office.id,
        reasonId: reasons[5].id, // Orthodontie - 60min
        date: futureDateInNext5Days(4, 15, 0),
        status: 'confirmed',
      },
    })
  );

  // Jour 5 - 2 rendez-vous (journée légère)
  futureAppointments.push(
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        officeId: office.id,
        reasonId: reasons[0].id, // Consultation - 20min
        date: futureDateInNext5Days(5, 10, 0),
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        officeId: office.id,
        reasonId: reasons[7].id, // Couronne - 60min
        date: futureDateInNext5Days(5, 14, 0),
        status: 'confirmed',
      },
    })
  );

  await Promise.all(futureAppointments);
  console.log('✅ Created', futureAppointments.length, 'future appointments (concentrated in next 5 days)');

  // Créer des avis clients
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        officeId: office.id,
        patientName: 'Amina B.',
        rating: 5,
        comment: 'Excellent service, le docteur est très professionnel et rassurant. Je recommande vivement !',
        date: new Date('2026-08-15'),
      },
    }),
    prisma.review.create({
      data: {
        officeId: office.id,
        patientName: 'Karim M.',
        rating: 5,
        comment: 'Cabinet moderne et propre. Équipe très accueillante. Mon traitement orthodontique se passe très bien.',
        date: new Date('2026-08-20'),
      },
    }),
    prisma.review.create({
      data: {
        officeId: office.id,
        patientName: 'Fatima B.',
        rating: 4,
        comment: 'Très bon dentiste, travail soigné. Seul bémol : l\'attente un peu longue parfois.',
        date: new Date('2026-08-25'),
      },
    }),
    prisma.review.create({
      data: {
        officeId: office.id,
        patientName: 'Youcef M.',
        rating: 5,
        comment: 'Intervention rapide pour une urgence. Personnel très sympathique et compétent.',
        date: new Date('2026-09-01'),
      },
    }),
    prisma.review.create({
      data: {
        officeId: office.id,
        patientName: 'Soraya H.',
        rating: 3,
        comment: 'Service correct mais j\'aurais apprécié plus d\'explications sur le traitement proposé.',
        date: new Date('2026-09-05'),
      },
    }),
  ]);

  console.log('✅ Created', reviews.length, 'reviews');

  // Créer des images de galerie (avant/après)
  const galleryImages = await Promise.all([
    prisma.galleryImage.create({
      data: {
        officeId: office.id,
        category: 'Blanchiment',
        beforeImage: 'https://placehold.co/600x400/e5e5e5/666666?text=Avant+Blanchiment',
        afterImage: 'https://placehold.co/600x400/ffffff/666666?text=Après+Blanchiment',
        description: 'Blanchiment dentaire professionnel - Résultat après une séance',
      },
    }),
    prisma.galleryImage.create({
      data: {
        officeId: office.id,
        category: 'Blanchiment',
        beforeImage: 'https://placehold.co/600x400/e5e5e5/666666?text=Avant+Traitement',
        afterImage: 'https://placehold.co/600x400/ffffff/666666?text=Après+Traitement',
        description: 'Transformation complète avec blanchiment et facettes',
      },
    }),
    prisma.galleryImage.create({
      data: {
        officeId: office.id,
        category: 'Orthodontie',
        beforeImage: 'https://placehold.co/600x400/e5e5e5/666666?text=Avant+Orthodontie',
        afterImage: 'https://placehold.co/600x400/ffffff/666666?text=Après+Orthodontie',
        description: 'Correction orthodontique - 18 mois de traitement',
      },
    }),
    prisma.galleryImage.create({
      data: {
        officeId: office.id,
        category: 'Orthodontie',
        beforeImage: 'https://placehold.co/600x400/e5e5e5/666666?text=Avant+Appareil',
        afterImage: 'https://placehold.co/600x400/ffffff/666666?text=Après+Appareil',
        description: 'Alignement dentaire complet avec appareil invisible',
      },
    }),
    prisma.galleryImage.create({
      data: {
        officeId: office.id,
        category: 'Implants',
        beforeImage: 'https://placehold.co/600x400/e5e5e5/666666?text=Avant+Implant',
        afterImage: 'https://placehold.co/600x400/ffffff/666666?text=Après+Implant',
        description: 'Pose d\'implant et couronne céramique',
      },
    }),
    prisma.galleryImage.create({
      data: {
        officeId: office.id,
        category: 'Implants',
        beforeImage: 'https://placehold.co/600x400/e5e5e5/666666?text=Avant+Restauration',
        afterImage: 'https://placehold.co/600x400/ffffff/666666?text=Après+Restauration',
        description: 'Restauration complète avec implants multiples',
      },
    }),
  ]);

  console.log('✅ Created', galleryImages.length, 'gallery images');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log('- 1 office (Cabinet Modèle)');
  console.log('-', reasons.length, 'appointment reasons');
  console.log('-', patients.length, 'patients');
  console.log('-', pastAppointments.length, 'past appointments');
  console.log('-', futureAppointments.length, 'future appointments (next 5 days)');
  console.log('-', reviews.length, 'reviews');
  console.log('-', galleryImages.length, 'gallery images');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
