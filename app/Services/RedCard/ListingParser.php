<?php

namespace App\Services\RedCard;

use App\Services\RedCard\DTOs\ListingEntry;
use Illuminate\Support\Collection;
use Symfony\Component\DomCrawler\Crawler;

class ListingParser
{
    /**
     * @return Collection<int, ListingEntry>
     */
    public function parse(string $html): Collection
    {
        $crawler = new Crawler($html);

        $results = $crawler->filter('#redCardTable tbody tr')->each(function (Crawler $row) {
            $tds = $row->filter('td');
            if ($tds->count() < 2) {
                return null;
            }

            // Parse categories from first td - use html() to preserve line breaks
            $categoryHtml = $tds->eq(0)->html();
            $categoryText = html_entity_decode(strip_tags($categoryHtml));
            $categories = collect(explode("\n", $categoryText))
                ->map(fn (string $cat) => trim($cat))
                ->filter()
                ->values()
                ->all();

            // Parse partner info from second td
            $linkNode = $tds->eq(1)->filter('a');
            if ($linkNode->count() === 0) {
                return null;
            }

            $href = $linkNode->attr('href');
            $name = trim($linkNode->filter('span.card-name')->text(''));
            $infos = trim($linkNode->filter('span.card-infos')->text(''));

            // Extract external ID from URL
            preg_match('/redcard-partner\/(\d+)/', $href, $idMatch);
            $externalId = isset($idMatch[1]) ? (int) $idMatch[1] : null;

            if (! $externalId || ! $name) {
                return null;
            }

            // Extract postal code and city
            $postalCode = null;
            $city = null;
            if (preg_match('/(\d{5})\s+(.+)/', $infos, $infoMatch)) {
                $postalCode = $infoMatch[1];
                $city = trim($infoMatch[2]);
            }

            return new ListingEntry(
                externalId: $externalId,
                name: $name,
                postalCode: $postalCode,
                city: $city,
                detailUrl: $href,
                categories: $categories,
            );
        });

        return collect($results);
    }

    /**
     * @return Collection<int, ListingEntry>
     */
    public function parseAndFilter(string $html): Collection
    {
        return collect($this->parse($html))->filter()->values();
    }
}
