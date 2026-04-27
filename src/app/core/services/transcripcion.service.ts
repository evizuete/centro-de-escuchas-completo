import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PresignedAudioResponse {
    presignedUrl: string;
}

@Injectable({ providedIn: 'root' })
export class TranscripcionService {
    private readonly http = inject(HttpClient);

    /**
     * Solicita al backend la generación (o recuperación, si ya existe en caché)
     * del audio traducido para una llamada y devuelve la presigned URL del MP3.
     *
     * TODO: ajustar la ruta del endpoint cuando esté definida en el backend.
     */
    generarAudioTraducido(llamadaId: string): Observable<PresignedAudioResponse> {
        return this.http.post<PresignedAudioResponse>(
            `/api/llamadas/${llamadaId}/audio-traducido`,
            {},
        );
    }
}