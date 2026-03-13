<?php

namespace App\Services\RedCard;

use App\Services\RedCard\DTOs\PartnerDetail;
use Symfony\Component\DomCrawler\Crawler;

class DetailParser
{
    public function parse(string $html): PartnerDetail
    {
        $crawler = new Crawler($html);
        $content = $crawler->filter('div.content-text');

        if ($content->count() === 0) {
            return new PartnerDetail();
        }

        // Parse contact info spans (not inside p tags with icons)
        $contactPerson = null;
        $streetAddress = null;
        $postalCode = null;
        $city = null;

        // span.red-card-info selects only <span> elements, not <p class="red-card-info"> (phone/fax/etc)
        $infoSpans = $content->filter('span.red-card-info:not(.red-card-icon)')->each(
            fn (Crawler $span) => trim($span->text(''))
        );
        $infoSpans = array_values(array_filter($infoSpans));

        // Heuristic splitting: last is PLZ+Ort, second-to-last is street, rest is contact person
        foreach ($infoSpans as $i => $span) {
            if (preg_match('/^\d{5}\s+/', $span)) {
                // This is PLZ + Ort
                if (preg_match('/(\d{5})\s+(.+)/', $span, $m)) {
                    $postalCode = $m[1];
                    $city = trim($m[2]);
                }
            } elseif (preg_match('/str\.|straße|weg\s|gasse|platz|ring\s|allee|^\d+\w?\s|.\d+\s*$/i', $span)) {
                $streetAddress = $span;
            } else {
                // If no street detected yet and this isn't the last item, it might be contact person
                if ($contactPerson === null) {
                    $contactPerson = $span;
                } else {
                    // Could be street address as fallback
                    $streetAddress = $streetAddress ?? $span;
                }
            }
        }

        // If we have exactly 3 spans and didn't match patterns well, use positional logic
        if (count($infoSpans) === 3 && ! $streetAddress) {
            $contactPerson = $infoSpans[0];
            $streetAddress = $infoSpans[1];
            // PLZ+Ort already parsed or parse the third
            if (! $postalCode && preg_match('/(\d{5})\s+(.+)/', $infoSpans[2], $m)) {
                $postalCode = $m[1];
                $city = trim($m[2]);
            }
        }

        // Phone
        $phone = $this->extractIconField($content, 'red-card-icon-phone');

        // Fax
        $fax = $this->extractIconField($content, 'red-card-icon-fax');

        // Email
        $email = null;
        $emailNode = $content->filter('p.red-card-icon-envelope-o a[href^="mailto:"]');
        if ($emailNode->count() > 0) {
            $email = trim($emailNode->text(''));
        }

        // Website
        $website = null;
        $webNode = $content->filter('p.red-card-icon-globe a');
        if ($webNode->count() > 0) {
            $website = trim($webNode->attr('href') ?? '');
        }

        // Image
        $imageUrl = null;
        $imgNode = $content->filter('img');
        if ($imgNode->count() > 0) {
            $imageUrl = $imgNode->attr('src');
        }

        // Discount description
        $discountDescription = null;
        $descNode = $content->filter('div.description');
        if ($descNode->count() > 0) {
            $discountDescription = trim($descNode->text(''));
        }

        // Body text
        $bodyText = null;
        $bodyNode = $content->filter('div.body');
        if ($bodyNode->count() > 0) {
            $bodyText = trim($bodyNode->text(''));
        }

        return new PartnerDetail(
            contactPerson: $contactPerson,
            streetAddress: $streetAddress,
            postalCode: $postalCode,
            city: $city,
            phone: $phone,
            fax: $fax,
            email: $email,
            website: $website,
            imageUrl: $imageUrl,
            discountDescription: $discountDescription,
            bodyText: $bodyText,
        );
    }

    private function extractIconField(Crawler $content, string $iconClass): ?string
    {
        $node = $content->filter("p.{$iconClass}");
        if ($node->count() === 0) {
            return null;
        }

        // Try to get from a link first
        $link = $node->filter('a');
        if ($link->count() > 0) {
            return trim($link->text(''));
        }

        return trim($node->text('')) ?: null;
    }
}
