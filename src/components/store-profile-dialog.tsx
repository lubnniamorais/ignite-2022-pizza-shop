import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z as zod } from 'zod';

import {
  getManagedRestaurant,
  GetManagedRestaurantResponse,
} from '@/api/get-managed-restaurant';
import { updateProfile } from '@/api/update-profile';

import { Button } from './ui/button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const storeProfileSchema = zod.object({
  name: zod.string().min(3),
  description: zod.string().nullable(),
});

type StoreProfileSchemaData = zod.infer<typeof storeProfileSchema>;

export function StoreProfileDialog() {
  const queryClient = useQueryClient();

  const { data: managedRestaurant } = useQuery({
    queryKey: ['managed-restaurant'],
    queryFn: getManagedRestaurant,
    staleTime: Infinity,
    // o tempo é customizado em milissegundos, logo 1000 milissegundos é igual a 1 segundo,
    // no entanto, quando passamoso valor Infinity, significa que nunca será recarregado
    // automaticamente os dados.
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<StoreProfileSchemaData>({
    resolver: zodResolver(storeProfileSchema),
    values: {
      name: managedRestaurant?.name ?? '',
      description: managedRestaurant?.description ?? '',
    },
  });

  const updateManagedRestaurantCache = useCallback(
    async ({ name, description }: StoreProfileSchemaData) => {
      const cached = queryClient.getQueryData<GetManagedRestaurantResponse>([
        'managed-restaurant',
      ]);

      if (cached) {
        queryClient.setQueryData<GetManagedRestaurantResponse>(
          ['managed-restaurant'],
          {
            ...cached,
            name,
            description,
          },
        );
      }

      // Aqui retorna os dados antes deles serem atualizados
      return { cached };
    },
    [queryClient],
  );

  const { mutateAsync: updateProfileFn } = useMutation({
    mutationFn: updateProfile,
    onMutate: async ({ name, description }) => {
      const { cached } = await updateManagedRestaurantCache({
        name,
        description,
      });

      return { previousProfile: cached };
    },
    onError(_, __, context) {
      if (context?.previousProfile) {
        // Caso aconteça um erro então passamos os dados antes de atualizar o cache
        updateManagedRestaurantCache(context.previousProfile);
      }
    },
  });

  const handleUpdateProfile = useCallback(
    async ({ name, description }: StoreProfileSchemaData) => {
      try {
        await updateProfileFn({ name, description });

        toast.success('Perfil atualizado com sucesso!');
      } catch (err) {
        toast.error('Falha ao atualizar o perfil, tente novamente!');
      }
    },
    [updateProfileFn],
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Perfil da loja</DialogTitle>
        <DialogDescription>
          Atualize as informações do seu estabelecimento visíveis ao seu cliente
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleUpdateProfile)}>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="name">
              Nome
            </Label>
            <Input className="col-span-3" id="name" {...register('name')} />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="description">
              Descrição
            </Label>
            <Textarea
              className="col-span-3"
              id="description"
              {...register('description')}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" variant="success" disabled={isSubmitting}>
            Salvar
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
