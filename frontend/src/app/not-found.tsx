import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Heading, Text } from '@/components/ui/typography';

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <Heading level={1}>Page not found</Heading>
      <Text className="mt-4">The page you are looking for does not exist.</Text>
      <ButtonLink href="/" className="mt-8">
        Back to home
      </ButtonLink>
    </Container>
  );
}
