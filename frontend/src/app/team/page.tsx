import { TeamProfile } from '@/components/team/team-profile';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';
import { teamMembers } from '@/lib/team/data';

export const metadata = buildMetadata({
  title: 'Meet The Team',
  description:
    'Meet the imams, teachers and coordinators who serve the community at Al-Rahmah Masjid, Leeds.',
  path: '/team',
});

export default function TeamPage() {
  return (
    <>
      <PageHero eyebrow={siteConfig.name} title="Meet The Team" />
      <section aria-label="Team profiles" className="py-20 sm:py-28">
        <Container className="divide-y divide-neutral-200">
          {teamMembers.map((member, i) => (
            <div key={member.id} className="py-16 first:pt-0 last:pb-0 lg:py-24">
              <TeamProfile member={member} flip={i % 2 === 1} />
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
